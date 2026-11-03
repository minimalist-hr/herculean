using Herculean.SharedKernel.Entities;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Domain.WeekPlan;

/// <summary>What a weekday holds from a date on. A change adds a new one, so past days keep the plan they had.</summary>
internal sealed class WeekPlanDay : Entity<WeekPlanDayId>
{
    private WeekPlanDay(WeekPlanDayId id, UserId userId, Weekday weekday, RoutineId? routineId, DateOnly effectiveFrom) : base(id)
    {
        UserId = userId;
        Weekday = weekday;
        RoutineId = routineId;
        EffectiveFrom = effectiveFrom;
    }

    public UserId UserId { get; private set; }

    public Weekday Weekday { get; private set; }

    /// <summary>Empty means a rest day.</summary>
    public RoutineId? RoutineId { get; private set; }

    public Routine? Routine { get; private set; }

    public DateOnly EffectiveFrom { get; private set; }

    public static WeekPlanDay Create(UserId userId, Weekday weekday, RoutineId? routineId, DateOnly effectiveFrom) =>
        new(WeekPlanDayId.New(), userId, weekday, routineId, effectiveFrom);

    /// <summary>Changes what this change holds, for a weekday changed again on the same date.</summary>
    public void ChangeRoutine(RoutineId? routineId)
    {
        RoutineId = routineId;
    }
}
