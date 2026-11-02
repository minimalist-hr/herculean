using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Routines.ListRoutines;

internal static class ListRoutinesEndpoint
{
    internal const string Name = "ListRoutines";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(RoutineRoutes.Routines, HandleAsync)
            .WithName(Name)
            .WithTags(RoutineRoutes.Tag);
    }

    [EndpointSummary("List the routines")]
    [EndpointDescription("Returns the signed-in user's routines by their first planned weekday, then name, with the unplanned ones last. Deleted routines are left out.")]
    [ProducesResponseType<List<RoutineListItemResponse>>(StatusCodes.Status200OK, Description = "The routines. Empty when there are none.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Ok<List<RoutineListItemResponse>>> HandleAsync(
        [FromServices] ListRoutinesHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
