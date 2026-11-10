using FluentValidation;

namespace Herculean.Training.Application.Workouts.UpdateWorkoutExerciseSuperset;

/// <summary>A true or false can't be wrong in itself: the workout decides whether the superset fits.</summary>
internal sealed class UpdateWorkoutExerciseSupersetValidator : AbstractValidator<UpdateWorkoutExerciseSupersetRequest>;
