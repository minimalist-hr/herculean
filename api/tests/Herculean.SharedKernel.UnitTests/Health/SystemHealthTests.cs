using Herculean.SharedKernel.Events;
using Herculean.SharedKernel.Health;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Time.Testing;

namespace Herculean.SharedKernel.UnitTests.Health;

public sealed class SystemHealthTests : IDisposable
{
    private static readonly DateTimeOffset Now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);
    private readonly TestDbContext _dbContext = new(new DbContextOptionsBuilder<TestDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    [Theory]
    [InlineData(HealthStatus.Healthy, 20, ServiceStatus.Working)]
    [InlineData(HealthStatus.Healthy, 1500, ServiceStatus.Slow)]
    [InlineData(HealthStatus.Degraded, 20, ServiceStatus.Behind)]
    [InlineData(HealthStatus.Unhealthy, 20, ServiceStatus.Down)]
    public void EachCheckSaysHowItsServiceIsDoing(HealthStatus status, int milliseconds, ServiceStatus expected)
    {
        SystemHealth.StatusOf(new HealthReportEntry(status, null, TimeSpan.FromMilliseconds(milliseconds), null, null)).ShouldBe(expected);
    }

    [Fact]
    public void TheReportListsEachServiceInOrderWithItsDetail()
    {
        HealthReport report = new(
            new Dictionary<string, HealthReportEntry>
            {
                ["API"] = new(HealthStatus.Healthy, "Answering requests.", TimeSpan.FromMilliseconds(1.4), null, null),
                ["Email"] = new(HealthStatus.Unhealthy, null, TimeSpan.FromMilliseconds(30), new TimeoutException(), null),
            },
            TimeSpan.FromMilliseconds(32));

        SystemHealthResponse response = SystemHealth.ToResponse(report, Now);

        response.CheckedAtUtc.ShouldBe(Now);
        response.Services.ShouldBe(
        [
            new ServiceHealthResponse("API", ServiceStatus.Working, 1, "Answering requests."),
            new ServiceHealthResponse("Email", ServiceStatus.Down, 30, "TimeoutException"),
        ]);
    }

    [Fact]
    public async Task AnEmptyOutboxIsHealthy()
    {
        HealthCheckResult result = await CheckOutboxAsync();

        result.Status.ShouldBe(HealthStatus.Healthy);
        result.Description.ShouldBe("Nothing waiting.");
    }

    [Fact]
    public async Task EventsWaitingAShortWhileAreHealthy()
    {
        await SaveEventAsync(Now.AddMinutes(-1));
        await SaveEventAsync(Now.AddMinutes(-2), processed: true);

        HealthCheckResult result = await CheckOutboxAsync();

        result.Status.ShouldBe(HealthStatus.Healthy);
        result.Description.ShouldBe("1 event waiting.");
    }

    [Fact]
    public async Task AnEventWaitingOver5MinutesIsBehind()
    {
        await SaveEventAsync(Now.AddMinutes(-6));
        await SaveEventAsync(Now.AddMinutes(-1));

        HealthCheckResult result = await CheckOutboxAsync();

        result.Status.ShouldBe(HealthStatus.Degraded);
        result.Description.ShouldBe("2 events waiting, the oldest over 5 minutes.");
    }

    [Fact]
    public async Task AFailedEventIsBehind()
    {
        await SaveEventAsync(Now.AddMinutes(-1), failed: true);

        HealthCheckResult result = await CheckOutboxAsync();

        result.Status.ShouldBe(HealthStatus.Degraded);
        result.Description.ShouldBe("1 event failed.");
    }

    [Fact]
    public async Task AnUnreachableDatabaseIsDown()
    {
        using TestDbContext dbContext = new(new DbContextOptionsBuilder<TestDbContext>()
            .UseNpgsql("Host=127.0.0.1;Port=1;Timeout=1;Database=none;Username=none;Password=none")
            .Options);

        HealthCheckResult result = await new DatabaseHealthCheck<TestDbContext>(dbContext).CheckHealthAsync(new HealthCheckContext(), Token);

        result.Status.ShouldBe(HealthStatus.Unhealthy);
        result.Description.ShouldBe("Couldn’t reach the database.");
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    private Task<HealthCheckResult> CheckOutboxAsync() =>
        new OutboxHealthCheck<TestDbContext>(_dbContext, new FakeTimeProvider(Now)).CheckHealthAsync(new HealthCheckContext(), Token);

    private async Task SaveEventAsync(DateTimeOffset occurredAtUtc, bool processed = false, bool failed = false)
    {
        OutboxMessage message = OutboxMessage.Create(new TestEvent("Hi"), occurredAtUtc);
        if (processed)
        {
            message.MarkProcessed(occurredAtUtc);
        }

        if (failed)
        {
            message.MarkFailed("Boom");
        }

        _dbContext.Add(message);
        await _dbContext.SaveChangesAsync(Token);
    }
}
