using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Domain.Workouts;

/// <summary>An exercise of a saved workout as edited: the workout exercise it was, or none for a new one, its sets, whether it is a superset with the next, and whether lengthened partials follow its sets.</summary>
internal sealed record EditedExercise(WorkoutExerciseId? Id, ExerciseId ExerciseId, IReadOnlyList<SetValues> Sets, bool SupersetWithNext = false, bool LengthenedPartials = false);
