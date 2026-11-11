using System.ComponentModel;

namespace Herculean.Account.Application.Users.GetUserStats;

[Description("How many people use Herculean. Admins aren't counted.")]
internal sealed record UserStatsResponse(
    [property: Description("Every user, those waiting for deletion included.")] int Total,
    [property: Description("Users who created their account in the last 7 days.")] int NewThisWeek,
    [property: Description("Accounts waiting to be deleted.")] int DeletingSoon,
    [property: Description("New users each week for the last 4 weeks, oldest first, the last 7 days last.")] List<int> NewPerWeek);
