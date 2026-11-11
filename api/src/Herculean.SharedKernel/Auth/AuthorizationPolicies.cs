using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Herculean.SharedKernel.Auth;

/// <summary>Who may call what. A user trains; an admin only manages feedback, and can't train.</summary>
public static class AuthorizationPolicies
{
    /// <summary>The access token claim that holds the role, as in RFC 9068.</summary>
    public const string RoleClaim = "role";

    /// <summary>The role of Minimalist's own accounts.</summary>
    public const string AdminRole = "admin";

    /// <summary>The policy of every admin endpoint.</summary>
    public const string Admin = "Admin";

    /// <summary>
    /// Every endpoint needs a signed-in user who isn't an admin, unless it says otherwise:
    /// anonymous, any signed-in account, or <see cref="RequireAdmin{TBuilder}"/>.
    /// </summary>
    /// <param name="services">The API's services.</param>
    public static IServiceCollection AddHerculeanAuthorization(this IServiceCollection services)
    {
        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireAssertion(context => !context.User.IsInRole(AdminRole))
                .Build())
            .AddPolicy(Admin, policy => policy.RequireAuthenticatedUser().RequireRole(AdminRole));

        return services;
    }

    /// <summary>Only an admin may call the endpoint.</summary>
    /// <typeparam name="TBuilder">The endpoint's builder.</typeparam>
    /// <param name="builder">The endpoint.</param>
    public static TBuilder RequireAdmin<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder =>
        builder.RequireAuthorization(Admin);
}
