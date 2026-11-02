using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.WeekPlan;

/// <summary>A routine a weekday holds now.</summary>
internal sealed record PlannedRoutine(Guid Id, string Name);

internal static class CurrentWeekPlan
{
    /// <summary>What each weekday holds now, which is its latest change. A rest day, or a day on a deleted routine, has null.</summary>
    /// <param name="dbContext">The Training database.</param>
    /// <param name="cancellationToken">Stops the read.</param>
    public static async Task<Dictionary<Weekday, PlannedRoutine?>> ReadAsync(TrainingDbContext dbContext, CancellationToken cancellationToken)
    {
        var changes = await dbContext.WeekPlanDays
            .AsNoTracking()
            .Select(day => new { day.Weekday, day.EffectiveFrom, day.RoutineId })
            .ToListAsync(cancellationToken);
        Dictionary<RoutineId, string> names = await dbContext.Routines
            .AsNoTracking()
            .ToDictionaryAsync(routine => routine.Id, routine => routine.Name, cancellationToken);

        return Enum.GetValues<Weekday>().ToDictionary(
            weekday => weekday,
            weekday =>
            {
                var latest = changes.Where(change => change.Weekday == weekday).MaxBy(change => change.EffectiveFrom);

                return latest?.RoutineId is RoutineId id && names.TryGetValue(id, out string? name)
                    ? new PlannedRoutine(id.Value, name)
                    : null;
            });
    }
}
