using System.ComponentModel;

using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Groups.ListGroups;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Groups.RestoreGroup;

internal static class RestoreGroupEndpoint
{
    internal const string Name = "RestoreGroup";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(GroupRoutes.RestoreGroup, HandleAsync)
            .WithName(Name)
            .WithTags(GroupRoutes.Tag);
    }

    [EndpointSummary("Restore a group")]
    [EndpointDescription("Brings a deleted group back in the place it had.")]
    [ProducesResponseType<GroupResponse>(StatusCodes.Status200OK, Description = "The restored group.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The group does not exist, is not deleted, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "Another group has its name now.")]
    private static async Task<Results<Ok<GroupResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The group's ID.")] Guid id,
        [FromServices] RestoreGroupHandler handler,
        CancellationToken cancellationToken)
    {
        Result<GroupResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
