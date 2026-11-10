using System.ComponentModel;

using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Export.GetExport;

[Description("Everything the user planned and logged, for a copy of their data.")]
internal sealed record ExportResponse(
    [property: Description("The exercises, by group and then name.")] List<ExportedExercise> Exercises,
    [property: Description("The routines, by name.")] List<ExportedRoutine> Routines,
    [property: Description("The workouts, oldest first.")] List<ExportedWorkout> Workouts);

[Description("An exercise.")]
internal sealed record ExportedExercise(
    [property: Description("Its name.")] string Name,
    [property: Description("Its group's name.")] string Group,
    [property: Description("The names of the other groups it works.")] List<string> AlsoWorks);

[Description("A routine.")]
internal sealed record ExportedRoutine(
    [property: Description("Its name.")] string Name,
    [property: Description("The weekdays it is on in the week plan, Monday first.")] List<Weekday> Days,
    [property: Description("Its exercises, in order.")] List<ExportedRoutineExercise> Exercises);

[Description("An exercise in a routine, with its targets.")]
internal sealed record ExportedRoutineExercise(
    [property: Description("The exercise's name.")] string Name,
    [property: Description("The target sets.")] int Sets,
    [property: Description("The low end of the target reps.")] int RepsFrom,
    [property: Description("The high end of the target reps.")] int RepsTo);

[Description("A workout.")]
internal sealed record ExportedWorkout(
    [property: Description("Its date, in the user's time zone.")] DateOnly Date,
    [property: Description("Its name, from the routine when it was created.")] string Name,
    [property: Description("Where it stands.")] WorkoutStatus Status,
    [property: Description("How long it took. Null when it has no duration.")] int? DurationSeconds,
    [property: Description("Its exercises, in order.")] List<ExportedWorkoutExercise> Exercises);

[Description("An exercise in a workout.")]
internal sealed record ExportedWorkoutExercise(
    [property: Description("The exercise's name, even if it was deleted since.")] string Name,
    [property: Description("The exercise's group.")] string Group,
    [property: Description("Its checked sets, in order. A skipped workout has none.")] List<ExportedSet> Sets);

[Description("A checked set.")]
internal sealed record ExportedSet(
    [property: Description("The weight in kg. A bodyweight set has 0.")] decimal WeightKg,
    [property: Description("The reps.")] int Reps);
