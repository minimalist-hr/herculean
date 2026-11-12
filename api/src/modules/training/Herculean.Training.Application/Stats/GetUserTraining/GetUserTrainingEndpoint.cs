using Herculean.SharedKernel.Auth;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Stats.GetUserTraining;

internal static class GetUserTrainingEndpoint
{
    internal const string Name = "GetUserTraining";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(StatsRoutes.User, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(StatsRoutes.Tag);
    }

    [EndpointSummary("Count a user's training")]
    [EndpointDescription("How many workouts a user finished and how many routines they have. A user with none, or no such user, has zeros. Admins only.")]
    [ProducesResponseType<UserTrainingResponse>(StatusCodes.Status200OK, Description = "The counts.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Ok<UserTrainingResponse>> HandleAsync(
        Guid id,
        [FromServices] GetUserTrainingHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(id, cancellationToken));
    }
}
