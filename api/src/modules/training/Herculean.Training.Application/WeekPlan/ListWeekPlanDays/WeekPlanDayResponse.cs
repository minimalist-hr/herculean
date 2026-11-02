using System.ComponentModel;

using Herculean.Training.Domain.WeekPlan;

namespace Herculean.Training.Application.WeekPlan.ListWeekPlanDays;

[Description("What a weekday holds in the week plan.")]
internal sealed record WeekPlanDayResponse(
    [property: Description("The weekday.")] Weekday Weekday,
    [property: Description("The routine's ID. Null on a rest day.")] Guid? RoutineId,
    [property: Description("The routine's name. Null on a rest day.")] string? RoutineName);
