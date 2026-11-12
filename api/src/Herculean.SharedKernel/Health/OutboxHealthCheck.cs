using Herculean.SharedKernel.Events;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Herculean.SharedKernel.Health;

/// <summary>Behind when an event failed, or waited longer than <see cref="WaitLimit"/>.</summary>
/// <typeparam name="TContext">The module's DbContext, which holds its outbox.</typeparam>
internal sealed class OutboxHealthCheck<TContext>(TContext dbContext, TimeProvider timeProvider) : IHealthCheck
    where TContext : DbContext
{
    internal static readonly TimeSpan WaitLimit = TimeSpan.FromMinutes(5);

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var waiting = await dbContext.Set<OutboxMessage>()
            .AsNoTracking()
            .Where(message => message.ProcessedAtUtc == null)
            .Select(message => new { message.OccurredAtUtc, Failed = message.Attempts > 0 })
            .ToListAsync(cancellationToken);

        int failed = waiting.Count(message => message.Failed);
        if (failed > 0)
        {
            return HealthCheckResult.Degraded($"{Events(failed)} failed.");
        }

        DateTimeOffset tooOld = timeProvider.GetUtcNow() - WaitLimit;
        return waiting.Exists(message => message.OccurredAtUtc < tooOld)
            ? HealthCheckResult.Degraded($"{Events(waiting.Count)} waiting, the oldest over {WaitLimit.TotalMinutes:0} minutes.")
            : HealthCheckResult.Healthy(waiting.Count == 0 ? "Nothing waiting." : $"{Events(waiting.Count)} waiting.");
    }

    private static string Events(int count) => count == 1 ? "1 event" : $"{count} events";
}
