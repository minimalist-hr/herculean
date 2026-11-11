using Herculean.SharedKernel.Time;

namespace Herculean.Account.Application.Users.GetUserStats;

internal sealed class GetUserStatsHandler(IUserReadRepository userReadRepository, TimeProvider timeProvider)
{
    public async Task<UserStatsResponse> HandleAsync(CancellationToken cancellationToken)
    {
        DateTimeOffset now = timeProvider.GetUtcNow();
        UserCounts counts = await userReadRepository.CountUsersAsync(Weeks.StartOf(now, Weeks.TrendLength - 1), cancellationToken);
        List<int> newPerWeek = Weeks.Count(counts.RecentSignUps, now);

        return new UserStatsResponse(counts.Total, newPerWeek[^1], counts.DeletingSoon, newPerWeek);
    }
}
