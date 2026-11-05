using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Auth;

namespace Herculean.Training.Application.Days.ListDays;

internal sealed class ListDaysHandler(
    IValidator<ListDaysRequest> validator,
    IDayReadRepository dayReadRepository,
    UserClock userClock)
{
    public async Task<Result<List<DaySummaryResponse>>> HandleAsync(ListDaysRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        List<PlanChange> changes = await dayReadRepository.ListPlanChangesAsync(cancellationToken);
        DayPlan plan = new(changes, await userClock.GetCalendarAsync(cancellationToken));
        List<DayWorkout> workouts = await dayReadRepository.ListWorkoutsAsync(request.From, request.To, cancellationToken);
        Dictionary<DateOnly, DayWorkout> byDate = workouts.ToDictionary(workout => workout.Date);
        int count = request.To.DayNumber - request.From.DayNumber + 1;

        return Enumerable.Range(0, count)
            .Select(offset => request.From.AddDays(offset))
            .Select(date => byDate.TryGetValue(date, out DayWorkout? workout)
                ? new DaySummaryResponse(date, workout.DayStatus, workout.Name)
                : new DaySummaryResponse(date, plan.StatusOn(date), plan.RoutineOn(date)?.RoutineName))
            .ToList();
    }
}
