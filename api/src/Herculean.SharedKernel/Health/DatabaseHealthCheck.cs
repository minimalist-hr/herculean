using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Herculean.SharedKernel.Health;

/// <summary>Asks the database for its version, through one module's context. Every module shares the database.</summary>
/// <typeparam name="TContext">The module's DbContext.</typeparam>
internal sealed class DatabaseHealthCheck<TContext>(TContext dbContext) : IHealthCheck
    where TContext : DbContext
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            string version = await dbContext.Database.SqlQueryRaw<string>("SELECT current_setting('server_version') AS \"Value\"").SingleAsync(cancellationToken);

            return HealthCheckResult.Healthy($"PostgreSQL {version}");
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            return HealthCheckResult.Unhealthy("Couldn’t reach the database.");
        }
    }
}
