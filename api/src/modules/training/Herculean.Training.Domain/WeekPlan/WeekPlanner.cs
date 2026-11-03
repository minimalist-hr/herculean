using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Domain.WeekPlan;

/// <summary>A weekday that moved to a routine from another one.</summary>
internal sealed record MovedDay(Weekday Weekday, RoutineId FromRoutineId);

/// <summary>Plans routines on weekdays. A day holds one routine, and past days keep the plan they had.</summary>
internal sealed class WeekPlanner(IWeekPlanDayRepository weekPlanDayRepository)
{
    /// <summary>Puts the routine on exactly these weekdays, on the next save. A weekday it leaves becomes a rest day.</summary>
    /// <param name="routine">The routine.</param>
    /// <param name="weekdays">The weekdays it should be on.</param>
    /// <param name="today">The user's date, from which the change applies.</param>
    /// <param name="cancellationToken">Stops the work.</param>
    /// <returns>The weekdays taken from other routines, which may include deleted ones.</returns>
    public async Task<List<MovedDay>> PlanRoutineAsync(Routine routine, IReadOnlyCollection<Weekday> weekdays, DateOnly today, CancellationToken cancellationToken)
    {
        List<WeekPlanDay> changes = await weekPlanDayRepository.ListAsync(cancellationToken);
        List<MovedDay> moved = [];

        foreach (Weekday weekday in Enum.GetValues<Weekday>().Order())
        {
            WeekPlanDay? latest = changes.Where(change => change.Weekday == weekday).MaxBy(change => change.EffectiveFrom);
            bool wanted = weekdays.Contains(weekday);
            if (!wanted && latest?.RoutineId != routine.Id)
            {
                continue;
            }

            RoutineId? routineId = wanted ? routine.Id : null;
            if (latest?.RoutineId == routineId)
            {
                continue;
            }

            if (wanted && latest?.RoutineId is RoutineId from)
            {
                moved.Add(new MovedDay(weekday, from));
            }

            // A weekday has one change per date, and a change made today has no past to keep.
            if (latest is not null && latest.EffectiveFrom >= today)
            {
                latest.ChangeRoutine(routineId);
            }
            else
            {
                weekPlanDayRepository.Add(WeekPlanDay.Create(routine.UserId, weekday, routineId, today));
            }
        }

        return moved;
    }
}
