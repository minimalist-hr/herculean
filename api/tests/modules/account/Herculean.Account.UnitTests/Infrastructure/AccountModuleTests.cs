using Herculean.Account.Application.Auth;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure;
using Herculean.Account.Infrastructure.Auth;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Herculean.Account.UnitTests.Infrastructure;

public sealed class AccountModuleTests
{
    [Fact]
    public void RegistersItsDbContextInTheAccountSchema()
    {
        HostApplicationBuilder builder = Host.CreateEmptyApplicationBuilder(new HostApplicationBuilderSettings());
        builder.Configuration["ConnectionStrings:database"] = "Host=localhost";
        builder.Services.AddSingleton(TimeProvider.System);

        builder.AddAccountModule();

        using ServiceProvider services = builder.Services.BuildServiceProvider();
        using AccountDbContext dbContext = services.GetRequiredService<AccountDbContext>();
        dbContext.Model.GetDefaultSchema().ShouldBe("account");
    }

    [Fact]
    public void JwtSettingsWithoutASigningKeyAreRejected()
    {
        HostApplicationBuilder builder = Host.CreateEmptyApplicationBuilder(new HostApplicationBuilderSettings());
        builder.Configuration["Jwt:Issuer"] = "herculean-api";
        builder.Configuration["Jwt:Audience"] = "herculean-app";
        builder.Configuration["Jwt:AccessTokenLifetime"] = "00:15:00";
        builder.Configuration["Jwt:RefreshTokenLifetime"] = "30.00:00:00";

        builder.AddAccountModule();

        using ServiceProvider services = builder.Services.BuildServiceProvider();
        Should.Throw<OptionsValidationException>(() => services.GetRequiredService<IOptions<JwtOptions>>().Value)
            .Message.ShouldContain(nameof(JwtOptions.SigningKey));
    }

    [Fact]
    public async Task IssuedAccessTokenPassesTheApisCheck()
    {
        HostApplicationBuilder builder = Host.CreateEmptyApplicationBuilder(new HostApplicationBuilderSettings());
        builder.Configuration["Jwt:Issuer"] = "herculean-api";
        builder.Configuration["Jwt:Audience"] = "herculean-app";
        builder.Configuration["Jwt:SigningKey"] = new string('k', 32);
        builder.Configuration["Jwt:AccessTokenLifetime"] = "00:15:00";
        builder.Configuration["Jwt:RefreshTokenLifetime"] = "30.00:00:00";
        builder.Services.AddSingleton(TimeProvider.System);
        builder.AddAccountModule();

        using ServiceProvider services = builder.Services.BuildServiceProvider();
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        string accessToken = services.GetRequiredService<ITokenIssuer>().Issue(user).AccessToken;
        JwtBearerOptions bearerOptions = services.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>().Get(JwtBearerDefaults.AuthenticationScheme);

        TokenValidationResult result = await new JsonWebTokenHandler().ValidateTokenAsync(accessToken, bearerOptions.TokenValidationParameters);

        result.IsValid.ShouldBeTrue();
        result.ClaimsIdentity.FindFirst("sub")?.Value.ShouldBe(user.Id.Value.ToString());
        bearerOptions.MapInboundClaims.ShouldBeFalse();
    }

    [Fact]
    public void RateLimitedEndpointsEachHaveTheirOwnRateLimit()
    {
        WebApplicationBuilder builder = WebApplication.CreateSlimBuilder();
        builder.Configuration["ConnectionStrings:database"] = "Host=localhost";
        builder.AddAccountModule();
        using WebApplication app = builder.Build();
        app.MapAccountModuleEndpoints();

        Dictionary<string, string?> rateLimits = ((IEndpointRouteBuilder)app).DataSources
            .SelectMany(source => source.Endpoints)
            .OfType<RouteEndpoint>()
            .Where(endpoint => endpoint.Metadata.GetMetadata<EnableRateLimitingAttribute>() is not null)
            .ToDictionary(
                endpoint => endpoint.RoutePattern.RawText!,
                endpoint => endpoint.Metadata.GetMetadata<EnableRateLimitingAttribute>()!.PolicyName);

        rateLimits.ShouldBe(new Dictionary<string, string?>
        {
            ["/api/v1/sessions"] = "sign-in",
            ["/api/v1/sessions/refresh"] = "refresh",
            ["/api/v1/password-resets"] = "password-reset",
            ["/api/v1/password-resets/complete"] = "password-reset-complete",
        });
    }
}
