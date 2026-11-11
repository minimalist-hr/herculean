using Herculean.SharedKernel.Auth;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.GetUserStats;

internal static class GetUserStatsEndpoint
{
    internal const string Name = "GetUserStats";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(UserRoutes.Stats, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(UserRoutes.Tag);
    }

    [EndpointSummary("Count the users")]
    [EndpointDescription("How many users there are, how many are new or waiting for deletion, and new users each week for 4 weeks. Weeks are the last 7 days and the 7 before them. Admins only.")]
    [ProducesResponseType<UserStatsResponse>(StatusCodes.Status200OK, Description = "The counts.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Ok<UserStatsResponse>> HandleAsync(
        [FromServices] GetUserStatsHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
