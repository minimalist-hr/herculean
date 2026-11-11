using System.ComponentModel;

namespace Herculean.Training.Application.Workouts.SwapWorkoutExercise;

[Description("The exercise to swap to.")]
internal sealed record SwapWorkoutExerciseRequest(
    [property: Description("The exercise's ID.")] Guid ExerciseId,
    [property: Description("The values the sets had, which is how a swap is undone. Left out, they start from the new exercise's last time.")] List<SwappedSet>? Sets = null,
    [property: Description("Whether lengthened partials were on, put back with the sets when a swap is undone. A swap itself turns them off.")] bool LengthenedPartials = false);

[Description("The values a set had before a swap.")]
internal sealed record SwappedSet(
    [property: Description("The weight in kg, 0 to 1,000 with up to two decimals. 0 means bodyweight.")] decimal WeightKg,
    [property: Description("The reps, 1 to 100.")] int Reps);
