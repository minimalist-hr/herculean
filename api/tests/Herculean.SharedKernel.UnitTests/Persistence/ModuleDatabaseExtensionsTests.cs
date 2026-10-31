using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Herculean.SharedKernel.UnitTests.Persistence;

public sealed class ModuleDatabaseExtensionsTests
{
    private const string Schema = "test";

    [Fact]
    public void KeepsMigrationHistoryInTheModuleSchema()
    {
        using ServiceProvider services = BuildServices(connectionString: "Host=localhost");
        using TestDbContext db = services.GetRequiredService<TestDbContext>();

        RelationalOptionsExtension.Extract(db.GetService<IDbContextOptions>()).MigrationsHistoryTableSchema.ShouldBe(Schema);
    }

    [Fact]
    public void NamesColumnsInSnakeCase()
    {
        using ServiceProvider services = BuildServices(connectionString: "Host=localhost");
        using TestDbContext db = services.GetRequiredService<TestDbContext>();

        db.Model.FindEntityType(typeof(TestEntity))!.FindProperty(nameof(TestEntity.CreatedAtUtc))!.GetColumnName().ShouldBe("created_at_utc");
    }

    [Fact]
    public void SetsTimestampsOnSave()
    {
        using ServiceProvider services = BuildServices(connectionString: "Host=localhost");
        using TestDbContext db = services.GetRequiredService<TestDbContext>();

        db.GetService<IDbContextOptions>().FindExtension<CoreOptionsExtension>()!.Interceptors!.ShouldContain(interceptor => interceptor is TimestampsInterceptor);
    }

    [Fact]
    public void FailsWithoutConnectionString()
    {
        using ServiceProvider services = BuildServices(connectionString: null);

        Should.Throw<InvalidOperationException>(services.GetRequiredService<TestDbContext>);
    }

    private static ServiceProvider BuildServices(string? connectionString)
    {
        HostApplicationBuilder builder = Host.CreateEmptyApplicationBuilder(new HostApplicationBuilderSettings());
        builder.Configuration["ConnectionStrings:database"] = connectionString;
        builder.Services.AddSingleton(TimeProvider.System);

        builder.AddModuleDbContext<TestDbContext>(Schema);

        return builder.Services.BuildServiceProvider();
    }
}
