using Herculean.Training.Application.Auth;
using Herculean.Training.Domain.Settings;

namespace Herculean.Training.Application.Settings.GetWorkoutSettings;

internal sealed class GetWorkoutSettingsHandler(IWorkoutSettingsReadRepository workoutSettingsReadRepository, CurrentUser currentUser)
{
    public async Task<WorkoutSettingsResponse> HandleAsync(CancellationToken cancellationToken) =>
        // Right after sign-up, the Account created event may not have created them yet.
        await workoutSettingsReadRepository.GetAsync(cancellationToken)
            ?? WorkoutSettingsResponse.From(WorkoutSettings.CreateStarting(currentUser.UserId));
}
