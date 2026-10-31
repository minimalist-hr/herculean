using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Herculean.SharedKernel.Persistence;

/// <summary>One database, with one schema and one DbContext per module.</summary>
public static class ModuleDatabaseExtensions
{
    private const string ConnectionName = "database";

    /// <summary>Registers a module's DbContext: its schema, snake_case names, timestamps and Aspire.</summary>
    /// <typeparam name="TContext">The module's DbContext.</typeparam>
    /// <param name="builder">The API's builder.</param>
    /// <param name="schema">The module's schema, for example <c>account</c>.</param>
    /// <exception cref="InvalidOperationException">The connection string is missing.</exception>
    public static void AddModuleDbContext<TContext>(this IHostApplicationBuilder builder, string schema)
        where TContext : DbContext
    {
        builder.Services.AddDbContext<TContext>((services, options) => options
            .UseNpgsql(
                builder.Configuration.GetConnectionString(ConnectionName)
                    ?? throw new InvalidOperationException($"The connection string '{ConnectionName}' is missing."),
                npgsql => npgsql.MigrationsHistoryTable(HistoryRepository.DefaultTableName, schema))
            .UseSnakeCaseNamingConvention()
            .AddInterceptors(new TimestampsInterceptor(services.GetRequiredService<TimeProvider>())));

        // Aspire adds retries, health checks and telemetry.
        builder.EnrichNpgsqlDbContext<TContext>();
    }

    /// <summary>Applies a module's pending migrations.</summary>
    /// <typeparam name="TContext">The module's DbContext.</typeparam>
    /// <param name="services">The API's services.</param>
    /// <param name="cancellationToken">Stops the migration.</param>
    public static async Task MigrateDatabaseAsync<TContext>(this IServiceProvider services, CancellationToken cancellationToken = default)
        where TContext : DbContext
    {
        await using AsyncServiceScope scope = services.CreateAsyncScope();

        await scope.ServiceProvider.GetRequiredService<TContext>().Database.MigrateAsync(cancellationToken);
    }
}
