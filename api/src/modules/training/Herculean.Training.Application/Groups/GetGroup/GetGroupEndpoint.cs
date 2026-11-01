using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Groups.GetGroup;

internal static class GetGroupEndpoint
{
    internal const string Name = "GetGroup";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(GroupRoutes.Group, HandleAsync)
            .WithName(Name)
            .WithTags(GroupRoutes.Tag);
    }

    [EndpointSummary("Get a group")]
    [EndpointDescription("Returns one of the signed-in user's groups, with the exercises that belong to it and the ones that also work it. Deleted exercises are left out.")]
    [ProducesResponseType<GroupDetailsResponse>(StatusCodes.Status200OK, Description = "The group.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The group does not exist, is deleted, or belongs to another user.")]
    private static async Task<Results<Ok<GroupDetailsResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The group's ID.")] Guid id,
        [FromServices] GetGroupHandler handler,
        CancellationToken cancellationToken)
    {
        Result<GroupDetailsResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
