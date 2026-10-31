using Herculean.Account.Infrastructure;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

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
        using AccountDbContext db = services.GetRequiredService<AccountDbContext>();
        db.Model.GetDefaultSchema().ShouldBe("account");
    }
}
