using System.ComponentModel;

namespace Herculean.Training.Application.Days.GetDay;

[Description("One day: its status, its routine and the day after it.")]
internal sealed record DayResponse(
    [property: Description("The date.")] DateOnly Date,
    [property: Description("How the day is shown.")] DayStatus Status,
    [property: Description("Whether the user has any routine. Without one, the app offers to create it.")] bool HasRoutines,
    [property: Description("The day's workout, which is how a workout is resumed or a skip undone. Null when it has none.")] Guid? WorkoutId,
    [property: Description("The routine planned on this day, or its workout, which shows the routine it came from. Null on a rest day.")] DayRoutineResponse? Routine,
    [property: Description("The day after this one.")] UpNextResponse UpNext);

[Description("A routine planned on a day.")]
internal sealed record DayRoutineResponse(
    [property: Description("The routine's ID. Null for a workout started empty.")] Guid? Id,
    [property: Description("The routine's name, or the workout's own.")] string Name,
    [property: Description("Whether the routine still exists, so it can be opened. False once it is deleted.")] bool Exists,
    [property: Description("Its exercises in order.")] List<DayExerciseResponse> Exercises);

[Description("An exercise in a day's routine and its targets.")]
internal sealed record DayExerciseResponse(
    [property: Description("The exercise's ID.")] Guid ExerciseId,
    [property: Description("The exercise's name.")] string Name,
    [property: Description("The ID of the group it belongs to.")] Guid GroupId,
    [property: Description("The name of the group it belongs to.")] string GroupName,
    [property: Description("The sets to do.")] int TargetSets,
    [property: Description("The low end of the rep range.")] int TargetRepsFrom,
    [property: Description("The high end of the rep range.")] int TargetRepsTo,
    [property: Description("Whether the exercise still exists, so it can be opened. False once it is deleted.")] bool Exists,
    [property: Description("Whether it is done as a superset with the exercise after it: a set of each, then rest.")] bool SupersetWithNext = false,
    [property: Description("Whether lengthened partials follow each set: half reps at the stretched end, right after the set.")] bool LengthenedPartials = false);

[Description("The day after a day.")]
internal sealed record UpNextResponse(
    [property: Description("Its date.")] DateOnly Date,
    [property: Description("The ID of the routine planned on it. Null on a rest day.")] Guid? RoutineId,
    [property: Description("The name of the routine planned on it. Null on a rest day.")] string? RoutineName);
