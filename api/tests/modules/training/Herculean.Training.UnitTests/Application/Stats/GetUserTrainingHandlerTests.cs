using Herculean.Training.Application.Stats;
using Herculean.Training.Application.Stats.GetUserTraining;

namespace Herculean.Training.UnitTests.Application.Stats;

public sealed class GetUserTrainingHandlerTests
{
    [Fact]
    public async Task TheUsersCountsAreReturned()
    {
        Guid ana = Guid.CreateVersion7();
        FakeStats stats = new(new UserTrainingCounts(12, 3));

        UserTrainingResponse response = await new GetUserTrainingHandler(stats).HandleAsync(ana, TestContext.Current.CancellationToken);

        response.ShouldBe(new UserTrainingResponse(12, 3));
        stats.UserId.ShouldBe(ana);
    }

    private sealed class FakeStats(UserTrainingCounts counts) : ITrainingStatsReadRepository
    {
        public Guid? UserId { get; private set; }

        public Task<List<FinishedWorkout>> ListFinishedSinceAsync(DateTimeOffset since, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<UserTrainingCounts> CountForUserAsync(Guid userId, CancellationToken cancellationToken)
        {
            UserId = userId;
            return Task.FromResult(counts);
        }
    }
}
