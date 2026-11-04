using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Days.GetFirstDay;

internal static class GetFirstDayEndpoint
{
    internal const string Name = "GetFirstDay";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(DayRoutes.FirstDay, HandleAsync)
            .WithName(Name)
            .WithTags(DayRoutes.Tag);
    }

    [EndpointSummary("Get the first day")]
    [EndpointDescription("Returns the first day the signed-in user can reach: the earlier of their first workout and the day their account was created.")]
    [ProducesResponseType<FirstDayResponse>(StatusCodes.Status200OK, Description = "The first day.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Ok<FirstDayResponse>> HandleAsync(
        [FromServices] GetFirstDayHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
