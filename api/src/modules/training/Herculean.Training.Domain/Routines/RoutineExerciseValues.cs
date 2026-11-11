using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Domain.Routines;

/// <summary>An exercise in a routine, its targets, whether it is done as a superset with the exercise after it, and whether lengthened partials follow each set.</summary>
internal sealed record RoutineExerciseValues(ExerciseId ExerciseId, int TargetSets, int TargetRepsFrom, int TargetRepsTo, bool SupersetWithNext = false, bool LengthenedPartials = false);
