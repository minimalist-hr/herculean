namespace Herculean.Training.Application.Stats.GetUserTraining;

internal sealed class GetUserTrainingHandler(ITrainingStatsReadRepository statsReadRepository)
{
    public async Task<UserTrainingResponse> HandleAsync(Guid userId, CancellationToken cancellationToken)
    {
        UserTrainingCounts counts = await statsReadRepository.CountForUserAsync(userId, cancellationToken);

        return new UserTrainingResponse(counts.Workouts, counts.Routines);
    }
}
