using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Groups.ListGroups;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Groups.CreateGroup;

internal static class CreateGroupEndpoint
{
    internal const string Name = "CreateGroup";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(GroupRoutes.Groups, HandleAsync)
            .WithName(Name)
            .WithTags(GroupRoutes.Tag);
    }

    [EndpointSummary("Create a group")]
    [EndpointDescription("Adds a group at the end of the signed-in user's groups.")]
    [ProducesResponseType<GroupResponse>(StatusCodes.Status201Created, Description = "The new group.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The name is not valid.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The user already has a group with this name, or has reached the limit of 50 groups.")]
    private static async Task<Results<Created<GroupResponse>, ProblemHttpResult>> HandleAsync(
        [FromBody] CreateGroupRequest request,
        [FromServices] CreateGroupHandler handler,
        CancellationToken cancellationToken)
    {
        Result<GroupResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess
            ? TypedResults.Created($"{GroupRoutes.Groups}/{result.Value.Id}", result.Value)
            : result.Error.ToProblem();
    }
}
