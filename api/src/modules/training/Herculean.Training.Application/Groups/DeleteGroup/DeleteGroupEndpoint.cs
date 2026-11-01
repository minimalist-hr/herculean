using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Groups.DeleteGroup;

internal static class DeleteGroupEndpoint
{
    internal const string Name = "DeleteGroup";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(GroupRoutes.Group, HandleAsync)
            .WithName(Name)
            .WithTags(GroupRoutes.Tag);
    }

    [EndpointSummary("Delete a group")]
    [EndpointDescription("Removes a group no exercise uses. It can be restored, and its name can be used again.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The group is deleted.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The group does not exist, is already deleted, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "An exercise uses the group, as its group or as also works.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The group's ID.")] Guid id,
        [FromServices] DeleteGroupHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
