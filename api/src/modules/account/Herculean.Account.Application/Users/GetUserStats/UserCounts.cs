namespace Herculean.Account.Application.Users.GetUserStats;

/// <summary>Users, not admins: how many there are, how many wait for deletion, and when the recent ones signed up.</summary>
internal sealed record UserCounts(int Total, int DeletingSoon, List<DateTimeOffset> RecentSignUps);
