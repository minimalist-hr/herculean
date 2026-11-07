using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.ListWorkouts;

internal static class ListWorkoutsEndpoint
{
    internal const string Name = "ListWorkouts";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(WorkoutRoutes.Workouts, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("List the workouts")]
    [EndpointDescription("Returns the signed-in user's workouts with a status, newest first. Deleted workouts are left out. Only one workout can be in progress, so inProgress returns at most one.")]
    [ProducesResponseType<List<WorkoutResponse>>(StatusCodes.Status200OK, Description = "The workouts. Empty when none match.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The status is missing or not inProgress.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Results<Ok<List<WorkoutResponse>>, ProblemHttpResult>> HandleAsync(
        [AsParameters] ListWorkoutsRequest request,
        [FromServices] ListWorkoutsHandler handler,
        CancellationToken cancellationToken)
    {
        Result<List<WorkoutResponse>> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
