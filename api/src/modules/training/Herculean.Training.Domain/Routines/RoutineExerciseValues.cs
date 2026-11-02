using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Domain.Routines;

/// <summary>An exercise in a routine and its targets.</summary>
internal sealed record RoutineExerciseValues(ExerciseId ExerciseId, int TargetSets, int TargetRepsFrom, int TargetRepsTo);
