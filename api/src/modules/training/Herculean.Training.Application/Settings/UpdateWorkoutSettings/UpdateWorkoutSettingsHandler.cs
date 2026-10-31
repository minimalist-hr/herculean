using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Auth;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Settings;

namespace Herculean.Training.Application.Settings.UpdateWorkoutSettings;

internal sealed class UpdateWorkoutSettingsHandler(
    IValidator<UpdateWorkoutSettingsRequest> validator,
    CurrentUser currentUser,
    IWorkoutSettingsRepository workoutSettingsRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<WorkoutSettingsResponse>> HandleAsync(UpdateWorkoutSettingsRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        WorkoutSettings? workoutSettings = await workoutSettingsRepository.GetForUserAsync(currentUser.UserId, cancellationToken);

        // Setup can change them right after sign-up, before the Account created event has created them.
        if (workoutSettings is null)
        {
            workoutSettings = WorkoutSettings.CreateStarting(currentUser.UserId);
            workoutSettingsRepository.Add(workoutSettings);
        }

        if (request.DefaultRestSeconds is int defaultRestSeconds)
        {
            workoutSettings.ChangeDefaultRest(defaultRestSeconds);
        }

        if (request.RestSound is bool restSound)
        {
            workoutSettings.ChangeRestSound(restSound);
        }

        if (request.RestVibrate is bool restVibrate)
        {
            workoutSettings.ChangeRestVibrate(restVibrate);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return WorkoutSettingsResponse.From(workoutSettings);
    }
}
