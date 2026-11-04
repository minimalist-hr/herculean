using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Days.GetFirstDay;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Training.UnitTests.Application.Days.GetFirstDay;

public sealed class GetFirstDayHandlerTests
{
    private readonly FakeDayReadRepository _dayReadRepository = new();
    private readonly FakeGetUserCreatedAt _getUserCreatedAt = new();
    private readonly GetFirstDayHandler _handler;

    public GetFirstDayHandlerTests()
    {
        FakeTimeProvider time = new(new DateTimeOffset(2026, 11, 3, 11, 0, 0, TimeSpan.Zero));
        CurrentUser currentUser = new(new FakeCurrentUserAccessor());
        _handler = new GetFirstDayHandler(
            _dayReadRepository,
            _getUserCreatedAt,
            new UserClock(currentUser, new FakeGetUserTimeZone(), time),
            currentUser);
    }

    private Task<FirstDayResponse> GetAsync() => _handler.HandleAsync(TestContext.Current.CancellationToken);

    [Fact]
    public async Task WithNoWorkoutItIsTheDayTheAccountWasCreated()
    {
        _getUserCreatedAt.CreatedAtUtc = new DateTimeOffset(2026, 10, 15, 12, 0, 0, TimeSpan.Zero);

        FirstDayResponse first = await GetAsync();

        first.Date.ShouldBe(new DateOnly(2026, 10, 15));
    }

    [Fact]
    public async Task TheAccountsDayFollowsTheUsersTimeZone()
    {
        // 23:30 UTC on 14 October is already 15 October in Zagreb.
        _getUserCreatedAt.CreatedAtUtc = new DateTimeOffset(2026, 10, 14, 23, 30, 0, TimeSpan.Zero);

        FirstDayResponse first = await GetAsync();

        first.Date.ShouldBe(new DateOnly(2026, 10, 15));
    }

    [Fact]
    public async Task AWorkoutBeforeTheAccountMovesItBack()
    {
        _getUserCreatedAt.CreatedAtUtc = new DateTimeOffset(2026, 10, 15, 12, 0, 0, TimeSpan.Zero);
        _dayReadRepository.FirstWorkoutDate = new DateOnly(2021, 3, 1);

        FirstDayResponse first = await GetAsync();

        first.Date.ShouldBe(new DateOnly(2021, 3, 1));
    }

    [Fact]
    public async Task AWorkoutAfterTheAccountLeavesIt()
    {
        _getUserCreatedAt.CreatedAtUtc = new DateTimeOffset(2026, 10, 15, 12, 0, 0, TimeSpan.Zero);
        _dayReadRepository.FirstWorkoutDate = new DateOnly(2026, 10, 20);

        FirstDayResponse first = await GetAsync();

        first.Date.ShouldBe(new DateOnly(2026, 10, 15));
    }
}
