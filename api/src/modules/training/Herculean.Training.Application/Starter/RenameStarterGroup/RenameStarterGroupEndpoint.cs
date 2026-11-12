using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Starter.RenameStarterGroup;

internal static class RenameStarterGroupEndpoint
{
    internal const string Name = "RenameStarterGroup";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(StarterRoutes.Group, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(StarterRoutes.Tag);
    }

    [EndpointSummary("Rename a starter group")]
    [EndpointDescription("Changes a starter group's name for accounts made from now on. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The starter group is renamed.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no starter group with this ID.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "Another starter group has this name.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromBody] SaveStarterGroupRequest request,
        [FromServices] RenameStarterGroupHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
