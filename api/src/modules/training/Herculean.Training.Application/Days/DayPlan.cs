using Herculean.Training.Application.Auth;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;

namespace Herculean.Training.Application.Days;

/// <summary>What a weekday holds from a date on. No routine ID means a rest day.</summary>
internal sealed record PlanChange(Weekday Weekday, DateOnly EffectiveFrom, RoutineId? RoutineId, string? RoutineName, DateTimeOffset? RoutineDeletedAtUtc);

/// <summary>What the week plan held on any date.</summary>
internal sealed class DayPlan(IReadOnlyCollection<PlanChange> changes, UserCalendar calendar)
{
    /// <summary>The change that puts a routine on this date, or null on a rest day. A deleted routine leaves rest days from the date it was deleted.</summary>
    public PlanChange? RoutineOn(DateOnly date)
    {
        Weekday weekday = (Weekday)(((int)date.DayOfWeek + 6) % 7);
        PlanChange? change = changes
            .Where(change => change.Weekday == weekday && change.EffectiveFrom <= date)
            .MaxBy(change => change.EffectiveFrom);

        if (change?.RoutineId is null)
        {
            return null;
        }

        return change.RoutineDeletedAtUtc is DateTimeOffset deletedAtUtc && date >= calendar.DateOf(deletedAtUtc) ? null : change;
    }

    public DayStatus StatusOn(DateOnly date)
    {
        if (RoutineOn(date) is null)
        {
            return DayStatus.Rest;
        }

        return date < calendar.Today ? DayStatus.Missed : DayStatus.Planned;
    }
}
