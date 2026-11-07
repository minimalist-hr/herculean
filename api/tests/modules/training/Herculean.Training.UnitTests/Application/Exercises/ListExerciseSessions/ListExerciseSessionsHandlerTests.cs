using System.Globalization;

using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Exercises.ListExerciseSessions;
using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.UnitTests.Application.Exercises.ListExerciseSessions;

public sealed class ListExerciseSessionsHandlerTests
{
    private static readonly DateOnly Newest = new(2026, 10, 30);

    private readonly ExerciseId _id = ExerciseId.New();
    private readonly FakeExerciseReadRepository _exerciseReadRepository = new();
    private readonly ListExerciseSessionsHandler _handler;

    public ListExerciseSessionsHandlerTests()
    {
        _exerciseReadRepository.Existing.Add(_id);
        _handler = new ListExerciseSessionsHandler(new ListExerciseSessionsValidator(), _exerciseReadRepository);
    }

    [Fact]
    public async Task AFullPageHasACursorToTheNext()
    {
        AddWeeklySessions(25);

        ExerciseSessionsResponse page = (await HandleAsync(null)).Value;

        page.Sessions.Count.ShouldBe(ListExerciseSessionsHandler.PageSize);
        page.Sessions[0].Date.ShouldBe(Newest);
        page.NextCursor.ShouldBe(page.Sessions[^1].Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
    }

    [Fact]
    public async Task TheCursorReadsTheRestAndTheLastPageHasNoCursor()
    {
        AddWeeklySessions(25);
        string cursor = (await HandleAsync(null)).Value.NextCursor.ShouldNotBeNull();

        ExerciseSessionsResponse page = (await HandleAsync(cursor)).Value;

        page.Sessions.Count.ShouldBe(5);
        page.Sessions.ShouldAllBe(session => session.Date < DateOnly.Parse(cursor, CultureInfo.InvariantCulture));
        page.NextCursor.ShouldBeNull();
    }

    [Fact]
    public async Task MonthsCountEverySessionInTheMonthsOnThePage()
    {
        AddWeeklySessions(25);
        string cursor = (await HandleAsync(null)).Value.NextCursor.ShouldNotBeNull();

        ExerciseSessionsResponse page = (await HandleAsync(cursor)).Value;

        // The page starts partway through its newest month, which still counts all of it.
        int sessionsInNewestMonth = _exerciseReadRepository.Sessions.Count(session =>
            session.Date.Year == page.Sessions[0].Date.Year && session.Date.Month == page.Sessions[0].Date.Month);
        page.Months[0].Sessions.ShouldBe(sessionsInNewestMonth);
        page.Months.Sum(month => month.Sessions).ShouldBeGreaterThan(page.Sessions.Count);
    }

    [Fact]
    public async Task AnExerciseNeverDoneHasAnEmptyPage()
    {
        ExerciseSessionsResponse page = (await HandleAsync(null)).Value;

        page.Sessions.ShouldBeEmpty();
        page.Months.ShouldBeEmpty();
        page.NextCursor.ShouldBeNull();
    }

    [Fact]
    public async Task AnUnknownExerciseFailsAsNotFound()
    {
        Result<ExerciseSessionsResponse> result = await _handler.HandleAsync(new ListExerciseSessionsRequest(Guid.CreateVersion7(), null), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(ExerciseErrors.NotFound);
    }

    [Theory]
    [InlineData("yesterday")]
    [InlineData("2026-13-01")]
    [InlineData("16.10.2026")]
    public async Task ACursorThatIsntADateFailsValidation(string cursor)
    {
        Result<ExerciseSessionsResponse> result = await HandleAsync(cursor);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
    }

    private Task<Result<ExerciseSessionsResponse>> HandleAsync(string? cursor) =>
        _handler.HandleAsync(new ListExerciseSessionsRequest(_id.Value, cursor), TestContext.Current.CancellationToken);

    private void AddWeeklySessions(int count)
    {
        for (int week = 0; week < count; week++)
        {
            _exerciseReadRepository.Sessions.Add(new ExerciseSessionResponse(Guid.CreateVersion7(), Newest.AddDays(-7 * week), "Legs", [new SessionSetResponse(100, 5)]));
        }
    }
}
