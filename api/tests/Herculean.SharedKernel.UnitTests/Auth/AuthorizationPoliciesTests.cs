using System.Security.Claims;

using Herculean.SharedKernel.Auth;

using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace Herculean.SharedKernel.UnitTests.Auth;

public sealed class AuthorizationPoliciesTests : IDisposable
{
    private static readonly ClaimsPrincipal User = SignedIn();
    private static readonly ClaimsPrincipal Admin = SignedIn(new Claim(AuthorizationPolicies.RoleClaim, AuthorizationPolicies.AdminRole));
    private readonly ServiceProvider _services;
    private readonly IAuthorizationService _authorization;
    private readonly AuthorizationPolicy _fallback;

    public AuthorizationPoliciesTests()
    {
        ServiceCollection services = new();
        services.AddLogging();
        services.AddHerculeanAuthorization();
        _services = services.BuildServiceProvider();
        _authorization = _services.GetRequiredService<IAuthorizationService>();
        _fallback = _services.GetRequiredService<IAuthorizationPolicyProvider>().GetFallbackPolicyAsync().Result!;
    }

    [Fact]
    public async Task EveryEndpointTakesAUserButNotAnAdminOrNoOne()
    {
        (await _authorization.AuthorizeAsync(User, null, _fallback)).Succeeded.ShouldBeTrue();
        (await _authorization.AuthorizeAsync(Admin, null, _fallback)).Succeeded.ShouldBeFalse();
        (await _authorization.AuthorizeAsync(new ClaimsPrincipal(new ClaimsIdentity()), null, _fallback)).Succeeded.ShouldBeFalse();
    }

    [Fact]
    public async Task AdminEndpointsTakeOnlyAnAdmin()
    {
        (await _authorization.AuthorizeAsync(Admin, AuthorizationPolicies.Admin)).Succeeded.ShouldBeTrue();
        (await _authorization.AuthorizeAsync(User, AuthorizationPolicies.Admin)).Succeeded.ShouldBeFalse();
    }

    public void Dispose()
    {
        _services.Dispose();
    }

    // As the API reads a token: claim names as they are, and roles from the role claim.
    private static ClaimsPrincipal SignedIn(params Claim[] claims) =>
        new(new ClaimsIdentity([new Claim("sub", Guid.CreateVersion7().ToString()), .. claims], "Bearer", "sub", AuthorizationPolicies.RoleClaim));
}
