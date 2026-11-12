using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Starter.ListStarterGroups;

internal static class ListStarterGroupsEndpoint
{
    internal const string Name = "ListStarterGroups";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(StarterRoutes.Groups, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(StarterRoutes.Tag);
    }

    [EndpointSummary("List starter groups")]
    [EndpointDescription("Every group a new account starts with, in order, with how many starter exercises belong to each. Admins only.")]
    [ProducesResponseType<List<StarterGroupResponse>>(StatusCodes.Status200OK, Description = "The starter groups, which can be none.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Results<Ok<List<StarterGroupResponse>>, ProblemHttpResult>> HandleAsync(
        [FromServices] ListStarterGroupsHandler handler,
        CancellationToken cancellationToken)
    {
        Result<List<StarterGroupResponse>> result = await handler.HandleAsync(cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
