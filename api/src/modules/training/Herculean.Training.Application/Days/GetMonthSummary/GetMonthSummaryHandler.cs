using System.Globalization;

using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Auth;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Days.GetMonthSummary;

internal sealed class GetMonthSummaryHandler(
    IValidator<GetMonthSummaryRequest> validator,
    IDayReadRepository dayReadRepository,
    UserClock userClock)
{
    public async Task<Result<MonthSummaryResponse>> HandleAsync(GetMonthSummaryRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        DateOnly first = DateOnly.ParseExact(request.Month, GetMonthSummaryValidator.MonthFormat, CultureInfo.InvariantCulture);
        DateOnly last = first.AddMonths(1).AddDays(-1);
        UserCalendar calendar = await userClock.GetCalendarAsync(cancellationToken);
        DayPlan plan = new(await dayReadRepository.ListPlanChangesAsync(cancellationToken), calendar);

        // Every workout is a skip until logging exists.
        List<DayWorkout> skipped = await dayReadRepository.ListWorkoutsAsync(first, last, cancellationToken);
        HashSet<DateOnly> skippedDates = [.. skipped.Select(workout => workout.Date)];
        List<PlanChange> missed = Enumerable.Range(0, last.DayNumber - first.DayNumber + 1)
            .Select(first.AddDays)
            .Where(date => date < calendar.Today && !skippedDates.Contains(date))
            .Select(plan.RoutineOn)
            .OfType<PlanChange>()
            .ToList();

        int setsPlanned = await CountSkippedSetsAsync(skipped, cancellationToken) + await CountMissedSetsAsync(missed, cancellationToken);
        int plannedDays = skipped.Count + missed.Count;

        return new MonthSummaryResponse(
            Done: 0,
            Missed: missed.Count,
            Skipped: skipped.Count,
            MinutesTrained: 0,
            SetsDone: 0,
            SetsPlanned: setsPlanned,
            VolumeKg: 0,
            PlannedDays: plannedDays,
            ConsistencyPercent: Consistency.Percent(0, plannedDays));
    }

    private async Task<int> CountSkippedSetsAsync(List<DayWorkout> skipped, CancellationToken cancellationToken)
    {
        int sets = 0;
        foreach (DayWorkout workout in skipped)
        {
            sets += (await dayReadRepository.ListWorkoutExercisesAsync(WorkoutId.From(workout.Id), cancellationToken)).Sum(exercise => exercise.TargetSets);
        }

        return sets;
    }

    private async Task<int> CountMissedSetsAsync(List<PlanChange> missed, CancellationToken cancellationToken)
    {
        int sets = 0;
        foreach (IGrouping<RoutineId?, PlanChange> days in missed.GroupBy(change => change.RoutineId))
        {
            if (days.Key is RoutineId routineId)
            {
                sets += days.Count() * (await dayReadRepository.ListExercisesAsync(routineId, cancellationToken)).Sum(exercise => exercise.TargetSets);
            }
        }

        return sets;
    }
}
