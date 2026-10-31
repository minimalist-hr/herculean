using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Settings.UpdateWorkoutSettings;

internal static class UpdateWorkoutSettingsEndpoint
{
    internal const string Name = "UpdateWorkoutSettings";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPatch(WorkoutSettingsRoutes.WorkoutSettings, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutSettingsRoutes.Tag);
    }

    [EndpointSummary("Change the workout settings")]
    [EndpointDescription("Changes the default rest time, rest sound or rest vibrate. A new account starts at 90 seconds, with sound and vibrate on.")]
    [ProducesResponseType<WorkoutSettingsResponse>(StatusCodes.Status200OK, Description = "The workout settings after the change.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each field.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Results<Ok<WorkoutSettingsResponse>, ProblemHttpResult>> HandleAsync(
        [FromBody] UpdateWorkoutSettingsRequest request,
        [FromServices] UpdateWorkoutSettingsHandler handler,
        CancellationToken cancellationToken)
    {
        Result<WorkoutSettingsResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
