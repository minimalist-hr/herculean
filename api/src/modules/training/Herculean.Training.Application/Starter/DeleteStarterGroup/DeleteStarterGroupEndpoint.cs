using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Starter.DeleteStarterGroup;

internal static class DeleteStarterGroupEndpoint
{
    internal const string Name = "DeleteStarterGroup";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(StarterRoutes.Group, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(StarterRoutes.Tag);
    }

    [EndpointSummary("Delete a starter group")]
    [EndpointDescription("Removes a group from what new accounts start with. Only a group no starter exercise uses can be deleted. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The starter group is gone.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no starter group with this ID.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "A starter exercise uses the group, as its group or as also works.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] DeleteStarterGroupHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
