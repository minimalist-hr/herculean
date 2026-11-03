using System.ComponentModel;

namespace Herculean.Training.Application.Days.ListDays;

[Description("A day's status, for the week strip.")]
internal sealed record DaySummaryResponse(
    [property: Description("The date.")] DateOnly Date,
    [property: Description("How the day is shown.")] DayStatus Status,
    [property: Description("The name of the routine planned on it. Null on a rest day.")] string? RoutineName);
