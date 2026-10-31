using Herculean.Account.Infrastructure;
using Herculean.Account.Infrastructure.Auth;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

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
}
