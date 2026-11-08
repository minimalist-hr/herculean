using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Records;
using Herculean.Training.Application.Records.ListRecentRecords;
using Herculean.Training.Domain.Exercises;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Training.UnitTests.Application.Records.ListRecentRecords;

public sealed class ListRecentRecordsHandlerTests
{
    private static readonly DateOnly Today = new(2026, 11, 4);

    private readonly FakeRecordReadRepository _recordReadRepository = new();
    private readonly ListRecentRecordsHandler _handler;

    public ListRecentRecordsHandlerTests()
    {
        FakeTimeProvider time = new(new DateTimeOffset(2026, 11, 4, 11, 0, 0, TimeSpan.Zero));
        _handler = new ListRecentRecordsHandler(
            _recordReadRepository,
            new UserClock(new CurrentUser(new FakeCurrentUserAccessor()), new FakeGetUserTimeZone(), time));
    }

    private void Add(ExerciseId id, string name, int daysAgo, decimal weightKg, int reps = 8)
    {
        _recordReadRepository.Sessions.Add(new HeaviestSession(id, name, Today.AddDays(-daysAgo), weightKg, reps));
    }

    private Task<List<RecentRecordResponse>> ListAsync() => _handler.HandleAsync(TestContext.Current.CancellationToken);

    [Fact]
    public async Task BeatingAnEarlierBestIsARecord()
    {
        ExerciseId bench = ExerciseId.New();
        Add(bench, "Bench press", 10, 80);
        Add(bench, "Bench press", 3, 82.5m, 10);

        (await ListAsync()).ShouldBe([new RecentRecordResponse(bench.Value, "Bench press", 82.5m, 10, Today.AddDays(-3))]);
    }

    [Fact]
    public async Task TheFirstTimeIsNotARecord()
    {
        Add(ExerciseId.New(), "Bench press", 3, 80);

        (await ListAsync()).ShouldBeEmpty();
    }

    [Fact]
    public async Task MatchingTheBestIsNotARecord()
    {
        ExerciseId bench = ExerciseId.New();
        Add(bench, "Bench press", 10, 80);
        Add(bench, "Bench press", 3, 80, 12);

        (await ListAsync()).ShouldBeEmpty();
    }

    [Fact]
    public async Task BodyweightIsNotARecord()
    {
        ExerciseId pullUp = ExerciseId.New();
        Add(pullUp, "Pull up", 10, 0, 8);
        Add(pullUp, "Pull up", 3, 0, 12);

        (await ListAsync()).ShouldBeEmpty();
    }

    [Fact]
    public async Task ARecordOlderThanThirtyDaysIsLeftOut()
    {
        ExerciseId bench = ExerciseId.New();
        Add(bench, "Bench press", 40, 80);
        Add(bench, "Bench press", 31, 85);

        (await ListAsync()).ShouldBeEmpty();
    }

    [Fact]
    public async Task EachExerciseShowsOnlyItsNewestRecord()
    {
        ExerciseId bench = ExerciseId.New();
        Add(bench, "Bench press", 20, 80);
        Add(bench, "Bench press", 10, 82.5m);
        Add(bench, "Bench press", 3, 85);

        (await ListAsync()).ShouldHaveSingleItem().WeightKg.ShouldBe(85);
    }

    [Fact]
    public async Task ShowsTheNewestThree()
    {
        foreach ((string name, int daysAgo) in new[] { ("A", 1), ("B", 2), ("C", 3), ("D", 4) })
        {
            ExerciseId id = ExerciseId.New();
            Add(id, name, 20, 50);
            Add(id, name, daysAgo, 60);
        }

        (await ListAsync()).Select(record => record.ExerciseName).ShouldBe(["A", "B", "C"]);
    }
}
