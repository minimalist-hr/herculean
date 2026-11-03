using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Routines.UpdateRoutine;

internal static class UpdateRoutineEndpoint
{
    internal const string Name = "UpdateRoutine";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(RoutineRoutes.Routine, HandleAsync)
            .WithName(Name)
            .WithTags(RoutineRoutes.Tag);
    }

    [EndpointSummary("Change a routine")]
    [EndpointDescription("Replaces a routine's name, exercises, order and targets. Workouts already started keep what they copied.")]
    [ProducesResponseType<RoutineResponse>(StatusCodes.Status200OK, Description = "The changed routine.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The routine or one of the exercises does not exist.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The user already has another routine with this name.")]
    private static async Task<Results<Ok<RoutineResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The routine's ID.")] Guid id,
        [FromBody] UpdateRoutineRequest request,
        [FromServices] UpdateRoutineHandler handler,
        CancellationToken cancellationToken)
    {
        Result<RoutineResponse> result = await handler.HandleAsync(id, request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
