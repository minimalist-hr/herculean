using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Herculean.SharedKernel.Health;

/// <summary>Adds the shared checks the admin sees, under <see cref="SystemHealth.Tag"/>.</summary>
public static class HealthCheckBuilderExtensions
{
    /// <summary>Adds the Database check, through a module's context.</summary>
    /// <typeparam name="TContext">The module's DbContext.</typeparam>
    /// <param name="builder">The health checks.</param>
    public static IHealthChecksBuilder AddDatabaseCheck<TContext>(this IHealthChecksBuilder builder)
        where TContext : DbContext =>
        builder.AddCheck<DatabaseHealthCheck<TContext>>("Database", tags: [SystemHealth.Tag]);

    /// <summary>Adds the Outbox check for a module's outbox.</summary>
    /// <typeparam name="TContext">The module's DbContext, which holds its outbox.</typeparam>
    /// <param name="builder">The health checks.</param>
    public static IHealthChecksBuilder AddOutboxCheck<TContext>(this IHealthChecksBuilder builder)
        where TContext : DbContext =>
        builder.AddCheck<OutboxHealthCheck<TContext>>("Outbox", tags: [SystemHealth.Tag]);
}
