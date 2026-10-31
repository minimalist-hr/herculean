using FluentValidation;

using Herculean.Training.Domain.Settings;

namespace Herculean.Training.Application.Settings.UpdateWorkoutSettings;

internal sealed class UpdateWorkoutSettingsValidator : AbstractValidator<UpdateWorkoutSettingsRequest>
{
    public UpdateWorkoutSettingsValidator()
    {
        RuleFor(request => request.DefaultRestSeconds)
            .Must(seconds => seconds is null || WorkoutSettings.IsDefaultRest(seconds.Value))
            .WithMessage("'{PropertyName}' must be a multiple of 15 seconds, from 15 to 600.");
    }
}
