using System.ComponentModel;

using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Groups.ListGroups;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Groups.RenameGroup;

internal static class RenameGroupEndpoint
{
    internal const string Name = "RenameGroup";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPatch(GroupRoutes.Group, HandleAsync)
            .WithName(Name)
            .WithTags(GroupRoutes.Tag);
    }

    [EndpointSummary("Rename a group")]
    [EndpointDescription("Changes a group's name. It shows on every chip and section.")]
    [ProducesResponseType<GroupResponse>(StatusCodes.Status200OK, Description = "The renamed group.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The name is not valid.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The group does not exist, is deleted, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The user already has another group with this name.")]
    private static async Task<Results<Ok<GroupResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The group's ID.")] Guid id,
        [FromBody] RenameGroupRequest request,
        [FromServices] RenameGroupHandler handler,
        CancellationToken cancellationToken)
    {
        Result<GroupResponse> result = await handler.HandleAsync(id, request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
