using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Groups.ListGroups;

internal static class ListGroupsEndpoint
{
    internal const string Name = "ListGroups";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(GroupRoutes.Groups, HandleAsync)
            .WithName(Name)
            .WithTags(GroupRoutes.Tag);
    }

    [EndpointSummary("List the groups")]
    [EndpointDescription("Returns the signed-in user's groups in their order. Deleted groups are left out. A new account starts with six.")]
    [ProducesResponseType<List<GroupListItemResponse>>(StatusCodes.Status200OK, Description = "The groups.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Ok<List<GroupListItemResponse>>> HandleAsync(
        [FromServices] ListGroupsHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
