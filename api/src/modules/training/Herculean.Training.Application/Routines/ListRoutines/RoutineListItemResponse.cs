using System.ComponentModel;

using Herculean.Training.Domain.WeekPlan;

namespace Herculean.Training.Application.Routines.ListRoutines;

[Description("A routine in the list.")]
internal sealed record RoutineListItemResponse(
    [property: Description("The routine's ID.")] Guid Id,
    [property: Description("The routine's name.")] string Name,
    [property: Description("How many exercises it has.")] int ExerciseCount,
    [property: Description("How many sets its exercises add up to.")] int SetCount,
    [property: Description("The weekdays it is planned on now, from Monday.")] List<Weekday> Weekdays);
