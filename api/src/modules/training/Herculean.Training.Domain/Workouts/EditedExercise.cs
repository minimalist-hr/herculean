using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Domain.Workouts;

/// <summary>An exercise of a saved workout as edited: the workout exercise it was, or none for a new one, and its sets.</summary>
internal sealed record EditedExercise(WorkoutExerciseId? Id, ExerciseId ExerciseId, IReadOnlyList<SetValues> Sets);
