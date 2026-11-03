using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Routines.RestoreRoutine;

internal static class RestoreRoutineEndpoint
{
    internal const string Name = "RestoreRoutine";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(RoutineRoutes.RestoreRoutine, HandleAsync)
            .WithName(Name)
            .WithTags(RoutineRoutes.Tag);
    }

    [EndpointSummary("Restore a routine")]
    [EndpointDescription("Brings a deleted routine back, on the weekdays that still hold it.")]
    [ProducesResponseType<RoutineResponse>(StatusCodes.Status200OK, Description = "The restored routine.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The routine does not exist, is not deleted, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "Another routine has its name now, or one of its exercises was deleted.")]
    private static async Task<Results<Ok<RoutineResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The routine's ID.")] Guid id,
        [FromServices] RestoreRoutineHandler handler,
        CancellationToken cancellationToken)
    {
        Result<RoutineResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
