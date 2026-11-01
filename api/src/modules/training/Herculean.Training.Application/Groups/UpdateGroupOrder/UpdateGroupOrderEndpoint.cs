using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Groups.UpdateGroupOrder;

internal static class UpdateGroupOrderEndpoint
{
    internal const string Name = "UpdateGroupOrder";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(GroupRoutes.GroupOrder, HandleAsync)
            .WithName(Name)
            .WithTags(GroupRoutes.Tag);
    }

    [EndpointSummary("Change the order of the groups")]
    [EndpointDescription("Sets the order of the signed-in user's groups, which orders the exercise list and the chips.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The order is saved.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The list repeats a group.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The list doesn't match the user's groups, which have changed.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromBody] UpdateGroupOrderRequest request,
        [FromServices] UpdateGroupOrderHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
