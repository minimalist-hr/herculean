using Herculean.Training.Application.Stats;
using Herculean.Training.Application.Stats.GetTrainingStats;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Training.UnitTests.Application.Stats;

public sealed class GetTrainingStatsHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid Ana = Guid.CreateVersion7();
    private static readonly Guid Ivo = Guid.CreateVersion7();

    [Fact]
    public async Task ActiveUsersAndWorkoutsAreCountedEachWeek()
    {
        FakeStats stats = new(
            new FinishedWorkout(Ana, Now.AddDays(-1)),
            new FinishedWorkout(Ana, Now.AddDays(-2)),
            new FinishedWorkout(Ivo, Now.AddDays(-3)),
            new FinishedWorkout(Ana, Now.AddDays(-8)),
            new FinishedWorkout(Ana, Now.AddDays(-22)));

        TrainingStatsResponse response = await new GetTrainingStatsHandler(stats, new FakeTimeProvider(Now)).HandleAsync(TestContext.Current.CancellationToken);

        response.ActiveThisWeek.ShouldBe(2);
        response.WorkoutsThisWeek.ShouldBe(3);
        response.WorkoutsLastWeek.ShouldBe(1);
        response.ActivePerWeek.ShouldBe([1, 0, 1, 2]);
        response.WorkoutsPerWeek.ShouldBe([1, 0, 1, 3]);
        stats.Since.ShouldBe(Now.AddDays(-28));
    }

    private sealed class FakeStats(params FinishedWorkout[] workouts) : ITrainingStatsReadRepository
    {
        public DateTimeOffset? Since { get; private set; }

        public Task<List<FinishedWorkout>> ListFinishedSinceAsync(DateTimeOffset since, CancellationToken cancellationToken)
        {
            Since = since;
            return Task.FromResult(workouts.ToList());
        }
    }
}
