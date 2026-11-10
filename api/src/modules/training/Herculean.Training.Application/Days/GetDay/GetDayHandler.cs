using Herculean.Training.Application.Auth;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Days.GetDay;

internal sealed class GetDayHandler(IDayReadRepository dayReadRepository, UserClock userClock)
{
    public async Task<DayResponse> HandleAsync(DateOnly date, CancellationToken cancellationToken)
    {
        List<PlanChange> changes = await dayReadRepository.ListPlanChangesAsync(cancellationToken);
        DayPlan plan = new(changes, await userClock.GetCalendarAsync(cancellationToken));

        DayWorkout? workout = await dayReadRepository.GetWorkoutAsync(date, cancellationToken);
        PlanChange? planned = plan.RoutineOn(date);
        RoutineId? shownRoutineId = workout is null ? planned?.RoutineId : workout.RoutineId;
        string? shownName = workout is null ? planned?.RoutineName : workout.Name;

        DayRoutineResponse? routine = null;
        if (shownRoutineId is RoutineId routineId && shownName is not null)
        {
            List<DayExerciseResponse> exercises = workout is null
                ? await dayReadRepository.ListExercisesAsync(routineId, cancellationToken)
                : await dayReadRepository.ListWorkoutExercisesAsync(WorkoutId.From(workout.Id), cancellationToken);
            bool exists = workout is null
                ? planned?.RoutineDeletedAtUtc is null
                : await dayReadRepository.RoutineExistsAsync(routineId, cancellationToken);
            routine = new DayRoutineResponse(routineId.Value, shownName, exists, exercises);
        }

        DateOnly nextDate = date.AddDays(1);

        return new DayResponse(
            date,
            workout?.DayStatus ?? plan.StatusOn(date),
            await dayReadRepository.HasRoutinesAsync(cancellationToken),
            workout?.Id,
            routine,
            UpNextOn(plan, nextDate));
    }

    private static UpNextResponse UpNextOn(DayPlan plan, DateOnly date)
    {
        PlanChange? next = plan.RoutineOn(date);

        return new UpNextResponse(date, next?.RoutineId?.Value, next?.RoutineName);
    }
}
