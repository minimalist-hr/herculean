using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure;
using Herculean.Account.Infrastructure.Auth;
using Herculean.Account.UnitTests.Application;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Herculean.Account.UnitTests.Infrastructure;

/// <summary>Sign in, refresh and the current user over HTTP, with the module's own wiring and an in-memory user store.</summary>
public sealed class SessionEndpointsTests : IAsyncLifetime
{
    private readonly FakeUserRepository _userRepository = new();
    private WebApplication _app = null!;
    private HttpClient _client = null!;

    public async ValueTask InitializeAsync()
    {
        WebApplicationBuilder builder = WebApplication.CreateSlimBuilder();
        builder.WebHost.UseTestServer();
        builder.Configuration["ConnectionStrings:database"] = "Host=localhost";
        builder.Configuration["Jwt:Issuer"] = "herculean-api";
        builder.Configuration["Jwt:Audience"] = "herculean-app";
        builder.Configuration["Jwt:SigningKey"] = new string('k', 32);
        builder.Configuration["Jwt:AccessTokenLifetime"] = "00:15:00";
        builder.Configuration["Jwt:RefreshTokenLifetime"] = "30.00:00:00";
        builder.Configuration["Tokens:ResetLinkLifetime"] = "01:00:00";
        builder.Configuration["Email:Host"] = "localhost";
        builder.Configuration["Email:Port"] = "1025";
        builder.Configuration["Email:From"] = "Herculean <no-reply@minimalist.hr>";
        builder.Configuration["Links:BaseUrl"] = "https://api.example.com";
        builder.Configuration["Links:AppUrl"] = "herculean://";
        builder.Services.AddSingleton(TimeProvider.System);
        builder.Services.AddStandardProblemDetails();
        builder.Services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());
        builder.AddAccountModule();
        builder.Services.AddSingleton<IUserRepository>(_userRepository);
        builder.Services.AddSingleton<IUnitOfWork>(new FakeUnitOfWork());

        _app = builder.Build();
        _app.UseStatusCodePages();
        _app.UseRateLimiter();
        _app.UseAuthentication();
        _app.UseAuthorization();
        _app.MapAccountModuleEndpoints();
        await _app.StartAsync(TestContext.Current.CancellationToken);
        _client = _app.GetTestClient();

        _userRepository.Add(User.Create("filip@example.com", new PasswordHasher().Hash("password"), "Europe/Zagreb"));
    }

    public async ValueTask DisposeAsync()
    {
        _client.Dispose();
        await _app.StopAsync(TestContext.Current.CancellationToken);
        await _app.DisposeAsync();
    }

    [Fact]
    public async Task RightPasswordSignsIn()
    {
        HttpResponseMessage response = await SignInAsync("Filip@Example.com", "password");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await ReadAsync(response)).GetProperty("accessToken").GetString().ShouldNotBeNullOrEmpty();
    }

    [Fact]
    public async Task WrongPasswordIsUnauthorized()
    {
        HttpResponseMessage response = await SignInAsync("filip@example.com", "wrong");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await ReadAsync(response)).GetProperty("code").GetString().ShouldBe("user.invalid_credentials");
    }

    [Fact]
    public async Task UnknownRefreshTokenIsUnauthorized()
    {
        HttpResponseMessage response = await RefreshAsync("unknown");

        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await ReadAsync(response)).GetProperty("code").GetString().ShouldBe("user.invalid_refresh_token");
    }

    [Fact]
    public async Task TooManySignInsWaitButRefreshKeepsItsOwnTries()
    {
        for (int attempt = 0; attempt < 10; attempt++)
        {
            (await SignInAsync("filip@example.com", "wrong")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        }

        HttpResponseMessage limited = await SignInAsync("filip@example.com", "password");

        limited.StatusCode.ShouldBe(HttpStatusCode.TooManyRequests);
        limited.Headers.RetryAfter.ShouldNotBeNull();
        (await ReadAsync(limited)).GetProperty("code").GetString().ShouldBe("too_many_requests");
        (await RefreshAsync("unknown")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CurrentUserNeedsAnAccessToken()
    {
        (await _client.GetAsync("/api/v1/users/me", TestContext.Current.CancellationToken)).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);

        string accessToken = (await ReadAsync(await SignInAsync("filip@example.com", "password"))).GetProperty("accessToken").GetString()!;
        using HttpRequestMessage request = new(HttpMethod.Get, "/api/v1/users/me");
        request.Headers.Authorization = new("Bearer", accessToken);
        HttpResponseMessage response = await _client.SendAsync(request, TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await ReadAsync(response)).GetProperty("email").GetString().ShouldBe("filip@example.com");
    }

    private Task<HttpResponseMessage> SignInAsync(string email, string password) =>
        _client.PostAsJsonAsync("/api/v1/sessions", new { email, password }, TestContext.Current.CancellationToken);

    private Task<HttpResponseMessage> RefreshAsync(string refreshToken) =>
        _client.PostAsJsonAsync("/api/v1/sessions/refresh", new { refreshToken }, TestContext.Current.CancellationToken);

    private static async Task<JsonElement> ReadAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
}
