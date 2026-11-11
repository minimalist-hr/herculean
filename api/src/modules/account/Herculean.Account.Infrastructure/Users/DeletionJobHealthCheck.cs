using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Herculean.Account.Infrastructure.Users;

/// <summary>Down when the last run failed, and behind when it hasn't run for over <see cref="RunLimit"/>.</summary>
internal sealed class DeletionJobHealthCheck(DeletionJobRuns runs, TimeProvider timeProvider) : IHealthCheck
{
    // It runs daily, so an hour more means it missed one.
    internal static readonly TimeSpan RunLimit = TimeSpan.FromHours(25);

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        if (runs.LastRunUtc is not DateTimeOffset lastRun)
        {
            return Task.FromResult(HealthCheckResult.Degraded("Hasn’t run since the API started."));
        }

        TimeSpan since = timeProvider.GetUtcNow() - lastRun;
        string ran = $"Ran {Ago(since)}.";
        if (runs.LastRunFailed)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy($"{ran[..^1]}, and failed."));
        }

        return Task.FromResult(since > RunLimit ? HealthCheckResult.Degraded($"{ran} It should run daily.") : HealthCheckResult.Healthy(ran));
    }

    internal static string Ago(TimeSpan since)
    {
        if (since < TimeSpan.FromMinutes(1))
        {
            return "just now";
        }

        if (since < TimeSpan.FromHours(1))
        {
            int minutes = (int)since.TotalMinutes;
            return minutes == 1 ? "1 minute ago" : $"{minutes} minutes ago";
        }

        int hours = (int)since.TotalHours;
        return hours == 1 ? "1 hour ago" : $"{hours} hours ago";
    }
}
