using System.ComponentModel;

using Herculean.Training.Domain.WeekPlan;

namespace Herculean.Training.Application.Routines.GetRoutine;

[Description("A routine, its days and its exercises.")]
internal sealed record RoutineDetailsResponse(
    [property: Description("The routine's ID.")] Guid Id,
    [property: Description("The routine's name.")] string Name,
    [property: Description("The weekdays it is planned on now, from Monday.")] List<Weekday> Weekdays,
    [property: Description("Its exercises in order.")] List<RoutineExerciseResponse> Exercises);

[Description("An exercise in a routine and its targets.")]
internal sealed record RoutineExerciseResponse(
    [property: Description("The exercise's ID.")] Guid ExerciseId,
    [property: Description("The exercise's name.")] string Name,
    [property: Description("The ID of the group it belongs to.")] Guid GroupId,
    [property: Description("The name of the group it belongs to.")] string GroupName,
    [property: Description("The sets to do.")] int TargetSets,
    [property: Description("The low end of the rep range.")] int TargetRepsFrom,
    [property: Description("The high end of the rep range.")] int TargetRepsTo,
    [property: Description("Whether it is done as a superset with the exercise after it: a set of each, then rest.")] bool SupersetWithNext = false,
    [property: Description("Whether lengthened partials follow each set: half reps at the stretched end, right after the set.")] bool LengthenedPartials = false);
