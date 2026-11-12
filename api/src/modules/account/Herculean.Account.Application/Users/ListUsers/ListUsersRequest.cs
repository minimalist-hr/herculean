using System.ComponentModel;

using Microsoft.AspNetCore.Mvc;

namespace Herculean.Account.Application.Users.ListUsers;

internal sealed record ListUsersRequest(
    [property: FromQuery(Name = "search"), Description("Part of a name or email, in any case. Left out, every user.")] string? Search,
    [property: FromQuery(Name = "deletingSoon"), Description("Only accounts waiting for deletion, the soonest first. Left out or false, every user, the newest first.")] bool? DeletingSoon,
    [property: FromQuery(Name = "cursor"), Description("The nextCursor of the page before. Leave it out for the first page.")] string? Cursor);
