using System.ComponentModel;

using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.GetWorkoutSummary;

[Description("What a workout comes to.")]
internal sealed record WorkoutSummaryResponse(
    [property: Description("Its name, from the routine when it was created.")] string Name,
    [property: Description("The date it belongs to.")] DateOnly Date,
    [property: Description("How long it took so far, in seconds. Null on a past day, which has no elapsed time.")] int? DurationSeconds,
    [property: Description("Checked sets.")] int SetsChecked,
    [property: Description("All its sets.")] int SetsTotal,
    [property: Description("Weight times reps over checked sets, in kilograms.")] decimal VolumeKg,
    [property: Description("The exercises with unchecked sets, in order.")] List<UncheckedExerciseResponse> UncheckedExercises,
    [property: Description("Its new records, at most one per exercise, in order.")] List<WorkoutRecordResponse> Records);

[Description("An exercise with sets that aren't checked.")]
internal sealed record UncheckedExerciseResponse(
    [property: Description("The exercise's name.")] string Name,
    [property: Description("Its unchecked sets.")] int UncheckedSets,
    [property: Description("All its sets.")] int Sets);

[Description("A set that beat every earlier set of its exercise.")]
internal sealed record WorkoutRecordResponse(
    [property: Description("The exercise's name.")] string Name,
    [property: Description("What it beat.")] RecordKind Kind,
    [property: Description("The weight in kg.")] decimal WeightKg,
    [property: Description("The reps.")] int Reps);
