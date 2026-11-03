using Herculean.Account.Contracts;
using Herculean.SharedKernel.Queries;

namespace Herculean.Training.Application.Auth;

/// <summary>The time as the current user sees it, in their time zone.</summary>
internal sealed class UserClock(
    CurrentUser currentUser,
    IQueryHandler<GetUserTimeZoneQuery, string> getUserTimeZone,
    TimeProvider timeProvider)
{
    public async Task<DateOnly> GetTodayAsync(CancellationToken cancellationToken)
    {
        string timeZoneId = await getUserTimeZone.HandleAsync(new GetUserTimeZoneQuery(currentUser.UserId.Value), cancellationToken);
        TimeZoneInfo timeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);

        return DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(timeProvider.GetUtcNow(), timeZone).DateTime);
    }
}
