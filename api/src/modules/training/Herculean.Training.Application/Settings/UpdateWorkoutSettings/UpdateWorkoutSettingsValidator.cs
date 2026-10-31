using FluentValidation;

using Herculean.Training.Domain.Settings;

namespace Herculean.Training.Application.Settings.UpdateWorkoutSettings;

internal sealed class UpdateWorkoutSettingsValidator : AbstractValidator<UpdateWorkoutSettingsRequest>
{
    public UpdateWorkoutSettingsValidator()
    {
        RuleFor(request => request.DefaultRestSeconds)
            .Must(seconds => seconds is null || WorkoutSettings.DefaultRestSecondsChoices.Contains(seconds.Value))
            .WithMessage($"'{{PropertyName}}' must be one of {string.Join(", ", WorkoutSettings.DefaultRestSecondsChoices)}.");
    }
}
