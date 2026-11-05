using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Application.Workouts;

/// <summary>The most reps an exercise has done at a weight.</summary>
internal sealed record EarlierMostReps(ExerciseId ExerciseId, decimal WeightKg, int Reps);
