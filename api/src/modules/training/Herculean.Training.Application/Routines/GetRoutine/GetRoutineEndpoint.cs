using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Routines.GetRoutine;

internal static class GetRoutineEndpoint
{
    internal const string Name = "GetRoutine";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(RoutineRoutes.Routine, HandleAsync)
            .WithName(Name)
            .WithTags(RoutineRoutes.Tag);
    }

    [EndpointSummary("Get a routine")]
    [EndpointDescription("Returns one of the signed-in user's routines, with the weekdays it is planned on and its exercises and targets in order.")]
    [ProducesResponseType<RoutineDetailsResponse>(StatusCodes.Status200OK, Description = "The routine.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The routine does not exist, is deleted, or belongs to another user.")]
    private static async Task<Results<Ok<RoutineDetailsResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The routine's ID.")] Guid id,
        [FromServices] GetRoutineHandler handler,
        CancellationToken cancellationToken)
    {
        Result<RoutineDetailsResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
