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

        // A workout in progress counts towards nothing until it's finished. A workout on a rest day counts as done, but its day wasn't planned.
        List<DayWorkout> workouts = await dayReadRepository.ListWorkoutsAsync(first, last, cancellationToken);
        List<DayWorkout> skipped = [.. workouts.Where(workout => workout.Status == WorkoutStatus.Skipped)];
        HashSet<DateOnly> workoutDates = [.. workouts.Select(workout => workout.Date)];
        List<PlanChange> missed = Enumerable.Range(0, last.DayNumber - first.DayNumber + 1)
            .Select(first.AddDays)
            .Where(date => date < calendar.Today && !workoutDates.Contains(date))
            .Select(plan.RoutineOn)
            .OfType<PlanChange>()
            .ToList();

        List<DoneWorkoutTotals> done = await dayReadRepository.ListDoneWorkoutTotalsAsync(first, last, cancellationToken);
        List<DoneWorkoutTotals> donePlanned = [.. done.Where(workout => plan.RoutineOn(workout.Date) is not null)];

        int setsPlanned = donePlanned.Sum(workout => workout.TargetSets)
            + await CountSkippedSetsAsync(skipped, cancellationToken)
            + await CountMissedSetsAsync(missed, cancellationToken);
        int plannedDays = donePlanned.Count + skipped.Count + missed.Count;

        return new MonthSummaryResponse(
            Done: done.Count,
            Missed: missed.Count,
            Skipped: skipped.Count,
            MinutesTrained: MinutesTrained(done),
            SetsDone: done.Sum(workout => workout.SetsDone),
            SetsPlanned: setsPlanned,
            VolumeKg: done.Sum(workout => workout.VolumeKg),
            PlannedDays: plannedDays,
            ConsistencyPercent: Consistency.Percent(done.Count, plannedDays));
    }

    /// <summary>A workout logged for a past day has no elapsed time, so it adds none.</summary>
    private static int MinutesTrained(List<DoneWorkoutTotals> done) =>
        (int)Math.Round(done
            .Where(workout => workout.StartedAtUtc is not null && workout.FinishedAtUtc is not null)
            .Sum(workout => (workout.FinishedAtUtc!.Value - workout.StartedAtUtc!.Value).TotalMinutes), MidpointRounding.AwayFromZero);

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
