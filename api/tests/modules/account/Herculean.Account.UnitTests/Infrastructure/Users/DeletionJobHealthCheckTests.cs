using Herculean.Account.Infrastructure.Users;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Infrastructure.Users;

public sealed class DeletionJobHealthCheckTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);
    private readonly DeletionJobRuns _runs = new();

    [Fact]
    public async Task AJobThatHasntRunIsBehind()
    {
        HealthCheckResult result = await CheckAsync();

        result.Status.ShouldBe(HealthStatus.Degraded);
        result.Description.ShouldBe("Hasn’t run since the API started.");
    }

    [Theory]
    [InlineData(0.5, "Ran just now.")]
    [InlineData(1, "Ran 1 minute ago.")]
    [InlineData(45, "Ran 45 minutes ago.")]
    [InlineData(60, "Ran 1 hour ago.")]
    [InlineData(120, "Ran 2 hours ago.")]
    public async Task ARecentRunIsHealthy(double minutesAgo, string detail)
    {
        _runs.Ran(Now.AddMinutes(-minutesAgo), failed: false);

        HealthCheckResult result = await CheckAsync();

        result.Status.ShouldBe(HealthStatus.Healthy);
        result.Description.ShouldBe(detail);
    }

    [Fact]
    public async Task ARunOver25HoursAgoIsBehind()
    {
        _runs.Ran(Now.AddHours(-26), failed: false);

        HealthCheckResult result = await CheckAsync();

        result.Status.ShouldBe(HealthStatus.Degraded);
        result.Description.ShouldBe("Ran 26 hours ago. It should run daily.");
    }

    [Fact]
    public async Task AFailedRunIsDown()
    {
        _runs.Ran(Now.AddHours(-2), failed: true);

        HealthCheckResult result = await CheckAsync();

        result.Status.ShouldBe(HealthStatus.Unhealthy);
        result.Description.ShouldBe("Ran 2 hours ago, and failed.");
    }

    private Task<HealthCheckResult> CheckAsync() =>
        new DeletionJobHealthCheck(_runs, new FakeTimeProvider(Now)).CheckHealthAsync(new HealthCheckContext(), TestContext.Current.CancellationToken);
}
