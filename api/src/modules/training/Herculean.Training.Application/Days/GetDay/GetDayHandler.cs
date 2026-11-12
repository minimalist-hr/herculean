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
        DayRoutineResponse? routine = workout is null
            ? await PlannedRoutineAsync(planned, cancellationToken)
            : await WorkoutRoutineAsync(workout, cancellationToken);

        DateOnly nextDate = date.AddDays(1);

        return new DayResponse(
            date,
            workout?.DayStatus ?? plan.StatusOn(date),
            await dayReadRepository.HasRoutinesAsync(cancellationToken),
            workout?.Id,
            routine,
            UpNextOn(plan, nextDate));
    }

    private async Task<DayRoutineResponse?> PlannedRoutineAsync(PlanChange? planned, CancellationToken cancellationToken)
    {
        if (planned is not { RoutineId: RoutineId routineId, RoutineName: string name })
        {
            return null;
        }

        List<DayExerciseResponse> exercises = await dayReadRepository.ListExercisesAsync(routineId, cancellationToken);

        return new DayRoutineResponse(routineId.Value, name, planned.RoutineDeletedAtUtc is null, exercises);
    }

    /// <summary>A workout shows its own name and exercises, also when it started empty, with no routine.</summary>
    private async Task<DayRoutineResponse> WorkoutRoutineAsync(DayWorkout workout, CancellationToken cancellationToken)
    {
        List<DayExerciseResponse> exercises = await dayReadRepository.ListWorkoutExercisesAsync(WorkoutId.From(workout.Id), cancellationToken);
        bool exists = workout.RoutineId is RoutineId routineId && await dayReadRepository.RoutineExistsAsync(routineId, cancellationToken);

        return new DayRoutineResponse(workout.RoutineId?.Value, workout.Name, exists, exercises);
    }

    private static UpNextResponse UpNextOn(DayPlan plan, DateOnly date)
    {
        PlanChange? next = plan.RoutineOn(date);

        return new UpNextResponse(date, next?.RoutineId?.Value, next?.RoutineName);
    }
}
