using Herculean.Account.Application.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.CreateUser;

internal static class CreateUserEndpoint
{
    internal const string Name = "CreateUser";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(UserRoutes.Users, HandleAsync)
            .WithName(Name)
            .WithTags(UserRoutes.Tag)
            .AllowAnonymous()
            .RequireRateLimiting(UserRoutes.CreateRateLimit);
    }

    [EndpointSummary("Create an account")]
    [EndpointDescription("Creates an account and signs it in. Name, units and default rest time are set afterwards, in setup.")]
    [ProducesResponseType<TokenResponse>(StatusCodes.Status201Created, Description = "The account was created and is signed in.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each field.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "An account with this email already exists.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests, "application/problem+json", Description = "Too many tries from this address. Wait a minute; Retry-After says how long.")]
    private static async Task<Results<Created<TokenResponse>, ProblemHttpResult>> HandleAsync(
        [FromBody] CreateUserRequest request,
        [FromServices] CreateUserHandler handler,
        CancellationToken cancellationToken)
    {
        Result<TokenResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Created(UserRoutes.Me, result.Value) : result.Error.ToProblem();
    }
}
