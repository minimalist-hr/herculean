using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Domain.Routines;

/// <summary>An exercise in a routine, its targets, and whether it is done as a superset with the exercise after it.</summary>
internal sealed record RoutineExerciseValues(ExerciseId ExerciseId, int TargetSets, int TargetRepsFrom, int TargetRepsTo, bool SupersetWithNext = false);
