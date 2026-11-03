using Herculean.Training.Application.Auth;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Training.UnitTests.Application.Auth;

public sealed class UserClockTests
{
    [Theory]
    [InlineData("Europe/Zagreb", 2026, 11, 3)]
    [InlineData("America/New_York", 2026, 11, 2)]
    public async Task TodayFollowsTheUsersTimeZone(string timeZone, int year, int month, int day)
    {
        // Half past midnight on 3 November in Zagreb, and still evening on 2 November in New York.
        FakeTimeProvider time = new(new DateTimeOffset(2026, 11, 2, 23, 30, 0, TimeSpan.Zero));
        UserClock userClock = new(new CurrentUser(new FakeCurrentUserAccessor()), new FakeGetUserTimeZone { TimeZone = timeZone }, time);

        DateOnly today = await userClock.GetTodayAsync(TestContext.Current.CancellationToken);

        today.ShouldBe(new DateOnly(year, month, day));
    }
}
