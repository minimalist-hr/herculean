using FluentValidation;

namespace Herculean.Training.Application.Workouts.UpdateWorkoutExerciseLengthenedPartials;

/// <summary>A true or false can't be wrong in itself.</summary>
internal sealed class UpdateWorkoutExerciseLengthenedPartialsValidator : AbstractValidator<UpdateWorkoutExerciseLengthenedPartialsRequest>;
