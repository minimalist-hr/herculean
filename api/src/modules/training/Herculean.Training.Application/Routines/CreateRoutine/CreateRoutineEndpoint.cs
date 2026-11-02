using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Routines.CreateRoutine;

internal static class CreateRoutineEndpoint
{
    internal const string Name = "CreateRoutine";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(RoutineRoutes.Routines, HandleAsync)
            .WithName(Name)
            .WithTags(RoutineRoutes.Tag);
    }

    [EndpointSummary("Create a routine")]
    [EndpointDescription("Adds a routine with its exercises and targets to the signed-in user's list. It isn't planned on any weekday yet.")]
    [ProducesResponseType<RoutineResponse>(StatusCodes.Status201Created, Description = "The new routine.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "One of the exercises does not exist.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The user already has a routine with this name, or has reached the limit of 50 routines.")]
    private static async Task<Results<Created<RoutineResponse>, ProblemHttpResult>> HandleAsync(
        [FromBody] CreateRoutineRequest request,
        [FromServices] CreateRoutineHandler handler,
        CancellationToken cancellationToken)
    {
        Result<RoutineResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess
            ? TypedResults.Created($"{RoutineRoutes.Routines}/{result.Value.Id}", result.Value)
            : result.Error.ToProblem();
    }
}
