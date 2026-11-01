using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using Herculean.Account.Application.Email;
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

/// <summary>Password reset over HTTP, with the module's own wiring, an in-memory user store and a fake email sender.</summary>
public sealed class PasswordResetEndpointsTests : IAsyncLifetime
{
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeEmailSender _emailSender = new();
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
        builder.Services.AddSingleton<IEmailSender>(_emailSender);

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
    public async Task TheWholeResetChangesThePassword()
    {
        (await SendLinkAsync("Filip@Example.com")).StatusCode.ShouldBe(HttpStatusCode.Accepted);
        SentEmail email = await _emailSender.Sent.ReadAsync(TestContext.Current.CancellationToken);
        email.Email.ShouldBe("filip@example.com");

        HttpResponseMessage page = await _client.GetAsync($"/links/reset-password?token={email.Token}", TestContext.Current.CancellationToken);
        page.StatusCode.ShouldBe(HttpStatusCode.OK);
        page.Content.Headers.ContentType?.MediaType.ShouldBe("text/html");
        page.Headers.CacheControl?.NoStore.ShouldBeTrue();
        (await page.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)).ShouldContain($"herculean://new-password?token={email.Token}");

        (await CompleteAsync(email.Token, "new-password")).StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await SignInAsync("password")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await SignInAsync("new-password")).StatusCode.ShouldBe(HttpStatusCode.OK);

        HttpResponseMessage usedAgain = await CompleteAsync(email.Token, "another-password");
        usedAgain.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await ReadAsync(usedAgain)).GetProperty("code").GetString().ShouldBe("user.invalid_password_reset_token");
    }

    [Fact]
    public async Task UnknownEmailGetsTheSameAnswerAndNoEmail()
    {
        (await SendLinkAsync("nobody@example.com")).StatusCode.ShouldBe(HttpStatusCode.Accepted);
        (await SendLinkAsync("filip@example.com")).StatusCode.ShouldBe(HttpStatusCode.Accepted);

        // The queue goes in order, so the first email out is for the known address.
        (await _emailSender.Sent.ReadAsync(TestContext.Current.CancellationToken)).Email.ShouldBe("filip@example.com");
    }

    [Fact]
    public async Task NewLinkCancelsTheOlderOne()
    {
        await SendLinkAsync("filip@example.com");
        SentEmail first = await _emailSender.Sent.ReadAsync(TestContext.Current.CancellationToken);
        await SendLinkAsync("filip@example.com");
        SentEmail second = await _emailSender.Sent.ReadAsync(TestContext.Current.CancellationToken);

        (await CompleteAsync(first.Token, "new-password")).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await CompleteAsync(second.Token, "new-password")).StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task UnknownLinkOpensTheExpiredScreen()
    {
        HttpResponseMessage page = await _client.GetAsync("/links/reset-password?token=unknown", TestContext.Current.CancellationToken);

        (await page.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)).ShouldContain("herculean://forgot-password?linkExpired=true");
    }

    [Fact]
    public async Task InvalidEmailIsABadRequest()
    {
        HttpResponseMessage response = await SendLinkAsync("not-an-email");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await ReadAsync(response)).GetProperty("code").GetString().ShouldBe("validation");
    }

    [Fact]
    public async Task TooManyLinksWaitButSignInKeepsItsOwnTries()
    {
        for (int attempt = 0; attempt < 10; attempt++)
        {
            (await SendLinkAsync("nobody@example.com")).StatusCode.ShouldBe(HttpStatusCode.Accepted);
        }

        HttpResponseMessage limited = await SendLinkAsync("nobody@example.com");

        limited.StatusCode.ShouldBe(HttpStatusCode.TooManyRequests);
        limited.Headers.RetryAfter.ShouldNotBeNull();
        (await SignInAsync("password")).StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    private Task<HttpResponseMessage> SendLinkAsync(string email) =>
        _client.PostAsJsonAsync("/api/v1/password-resets", new { email }, TestContext.Current.CancellationToken);

    private Task<HttpResponseMessage> CompleteAsync(string token, string password) =>
        _client.PostAsJsonAsync("/api/v1/password-resets/complete", new { token, password }, TestContext.Current.CancellationToken);

    private Task<HttpResponseMessage> SignInAsync(string password) =>
        _client.PostAsJsonAsync("/api/v1/sessions", new { email = "filip@example.com", password }, TestContext.Current.CancellationToken);

    private static async Task<JsonElement> ReadAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
}
