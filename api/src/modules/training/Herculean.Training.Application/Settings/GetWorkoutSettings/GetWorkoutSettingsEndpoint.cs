using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Settings.GetWorkoutSettings;

internal static class GetWorkoutSettingsEndpoint
{
    internal const string Name = "GetWorkoutSettings";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(WorkoutSettingsRoutes.WorkoutSettings, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutSettingsRoutes.Tag);
    }

    [EndpointSummary("Get the workout settings")]
    [EndpointDescription("Returns the signed-in user's default rest time, rest sound and rest vibrate.")]
    [ProducesResponseType<WorkoutSettingsResponse>(StatusCodes.Status200OK, Description = "The workout settings.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Ok<WorkoutSettingsResponse>> HandleAsync(
        [FromServices] GetWorkoutSettingsHandler handler,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(await handler.HandleAsync(cancellationToken));
}
