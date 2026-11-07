using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Exercises.GetExerciseProgress;
using Herculean.Training.Domain.Exercises;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Training.UnitTests.Application.Exercises.GetExerciseProgress;

public sealed class GetExerciseProgressHandlerTests
{
    private static readonly DateOnly Today = new(2026, 11, 7);

    private readonly ExerciseId _id = ExerciseId.New();
    private readonly FakeExerciseReadRepository _exerciseReadRepository = new();
    private readonly GetExerciseProgressHandler _handler;

    public GetExerciseProgressHandlerTests()
    {
        _exerciseReadRepository.Existing.Add(_id);
        FakeTimeProvider time = new(new DateTimeOffset(2026, 11, 7, 11, 0, 0, TimeSpan.Zero));
        _handler = new GetExerciseProgressHandler(
            new GetExerciseProgressValidator(),
            _exerciseReadRepository,
            new UserClock(new CurrentUser(new FakeCurrentUserAccessor()), new FakeGetUserTimeZone(), time));
    }

    [Theory]
    [InlineData("3m", 2026, 8, 7)]
    [InlineData("6m", 2026, 5, 7)]
    [InlineData("1y", 2025, 11, 7)]
    public async Task ARangeReadsBackFromToday(string range, int year, int month, int day)
    {
        await HandleAsync(range);

        _exerciseReadRepository.HeaviestFrom.ShouldBe(new DateOnly(year, month, day));
    }

    [Fact]
    public async Task AllReadsEverySession()
    {
        await HandleAsync("all");

        _exerciseReadRepository.HeaviestFrom.ShouldBeNull();
    }

    [Fact]
    public async Task UpToSixtySessionsShowEachOne()
    {
        AddWeeklySessions(GetExerciseProgressHandler.MaxSessionPoints);

        ExerciseProgressResponse progress = (await HandleAsync("all")).Value;

        progress.ByMonth.ShouldBeFalse();
        progress.Points.ShouldBe(_exerciseReadRepository.HeaviestSets);
    }

    [Fact]
    public async Task MoreThanSixtySessionsShowEachMonthsHeaviestSetOldestFirst()
    {
        AddWeeklySessions(GetExerciseProgressHandler.MaxSessionPoints + 1);

        ExerciseProgressResponse progress = (await HandleAsync("all")).Value;

        progress.ByMonth.ShouldBeTrue();
        progress.Points.Select(point => (point.Date.Year, point.Date.Month)).ShouldBeUnique();
        progress.Points.ShouldBe(progress.Points.OrderBy(point => point.Date));
        ProgressPointResponse newest = progress.Points[^1];
        newest.WeightKg.ShouldBe(_exerciseReadRepository.HeaviestSets
            .Where(point => point.Date.Year == newest.Date.Year && point.Date.Month == newest.Date.Month)
            .Max(point => point.WeightKg));
    }

    [Fact]
    public async Task AMonthsHeaviestSetBreaksATieOnWeightWithMoreReps()
    {
        AddWeeklySessions(GetExerciseProgressHandler.MaxSessionPoints);
        _exerciseReadRepository.HeaviestSets.Add(new ProgressPointResponse(Today, 500, 3));
        _exerciseReadRepository.HeaviestSets.Insert(_exerciseReadRepository.HeaviestSets.Count - 1, new ProgressPointResponse(Today.AddDays(-1), 500, 5));

        ExerciseProgressResponse progress = (await HandleAsync("all")).Value;

        progress.Points[^1].ShouldBe(new ProgressPointResponse(Today.AddDays(-1), 500, 5));
    }

    [Fact]
    public async Task ARangeWithNoSessionsHasNoPoints()
    {
        ExerciseProgressResponse progress = (await HandleAsync("3m")).Value;

        progress.Points.ShouldBeEmpty();
        progress.ByMonth.ShouldBeFalse();
    }

    [Fact]
    public async Task AnUnknownRangeFailsValidation()
    {
        Result<ExerciseProgressResponse> result = await HandleAsync("2w");

        result.IsSuccess.ShouldBeFalse();
        result.Error.ShouldNotBeNull().Code.ShouldBe("validation");
    }

    [Fact]
    public async Task AnUnknownExerciseFailsAsNotFound()
    {
        Result<ExerciseProgressResponse> result = await _handler.HandleAsync(new GetExerciseProgressRequest(Guid.CreateVersion7()), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(ExerciseErrors.NotFound);
    }

    private Task<Result<ExerciseProgressResponse>> HandleAsync(string range) =>
        _handler.HandleAsync(new GetExerciseProgressRequest(_id.Value, range), TestContext.Current.CancellationToken);

    /// <summary>One session a week up to today, oldest first, each heavier than the one before.</summary>
    private void AddWeeklySessions(int count)
    {
        for (int week = count - 1; week >= 0; week--)
        {
            _exerciseReadRepository.HeaviestSets.Add(new ProgressPointResponse(Today.AddDays(-7 * week), 100 + count - week, 5));
        }
    }
}
