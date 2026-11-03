using Herculean.Account.Contracts;
using Herculean.SharedKernel.Queries;

namespace Herculean.Training.Application.Auth;

/// <summary>Today and dates as the current user sees them, in their time zone.</summary>
internal sealed record UserCalendar(DateOnly Today, TimeZoneInfo TimeZone)
{
    public DateOnly DateOf(DateTimeOffset moment) => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(moment, TimeZone).DateTime);
}

/// <summary>The time as the current user sees it, in their time zone.</summary>
internal sealed class UserClock(
    CurrentUser currentUser,
    IQueryHandler<GetUserTimeZoneQuery, string> getUserTimeZone,
    TimeProvider timeProvider)
{
    public async Task<DateOnly> GetTodayAsync(CancellationToken cancellationToken) =>
        (await GetCalendarAsync(cancellationToken)).Today;

    public async Task<UserCalendar> GetCalendarAsync(CancellationToken cancellationToken)
    {
        string timeZoneId = await getUserTimeZone.HandleAsync(new GetUserTimeZoneQuery(currentUser.UserId.Value), cancellationToken);
        TimeZoneInfo timeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);

        DateOnly today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), timeZone).DateTime);

        return new UserCalendar(today, timeZone);
    }
}
