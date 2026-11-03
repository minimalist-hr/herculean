using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Routines.DeleteRoutine;

internal static class DeleteRoutineEndpoint
{
    internal const string Name = "DeleteRoutine";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(RoutineRoutes.Routine, HandleAsync)
            .WithName(Name)
            .WithTags(RoutineRoutes.Tag);
    }

    [EndpointSummary("Delete a routine")]
    [EndpointDescription("Removes a routine from the signed-in user's list. Its weekdays read as rest days while it is deleted, logged workouts keep their name, and its name can be used again.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The routine is deleted.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The routine does not exist, is already deleted, or belongs to another user.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The routine's ID.")] Guid id,
        [FromServices] DeleteRoutineHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
