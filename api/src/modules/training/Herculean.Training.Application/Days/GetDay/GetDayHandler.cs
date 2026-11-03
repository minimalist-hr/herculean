using Herculean.Training.Application.Auth;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Application.Days.GetDay;

internal sealed class GetDayHandler(IDayReadRepository dayReadRepository, UserClock userClock)
{
    public async Task<DayResponse> HandleAsync(DateOnly date, CancellationToken cancellationToken)
    {
        List<PlanChange> changes = await dayReadRepository.ListPlanChangesAsync(cancellationToken);
        DayPlan plan = new(changes, await userClock.GetCalendarAsync(cancellationToken));

        DayRoutineResponse? routine = null;
        if (plan.RoutineOn(date) is { RoutineId: RoutineId routineId, RoutineName: string name })
        {
            routine = new DayRoutineResponse(routineId.Value, name, await dayReadRepository.ListExercisesAsync(routineId, cancellationToken));
        }

        DateOnly nextDate = date.AddDays(1);

        return new DayResponse(
            date,
            plan.StatusOn(date),
            await dayReadRepository.HasRoutinesAsync(cancellationToken),
            routine,
            new UpNextResponse(nextDate, plan.RoutineOn(nextDate)?.RoutineName));
    }
}
