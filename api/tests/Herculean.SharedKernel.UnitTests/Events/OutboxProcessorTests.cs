using Herculean.SharedKernel.Events;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Time.Testing;

namespace Herculean.SharedKernel.UnitTests.Events;

public sealed class OutboxProcessorTests : IAsyncDisposable
{
    private static readonly DateTimeOffset Now = new(2026, 10, 31, 18, 0, 0, TimeSpan.Zero);

    private readonly TestIntegrationEventHandler _testIntegrationEventHandler = new();
    private readonly ServiceProvider _services;

    public OutboxProcessorTests()
    {
        string databaseName = Guid.NewGuid().ToString();
        ServiceCollection services = new();
        services.AddLogging();
        services.AddSingleton<TimeProvider>(new FakeTimeProvider(Now));
        services.AddDbContext<TestDbContext>(options => options.UseInMemoryDatabase(databaseName));
        services.AddOutbox<TestDbContext>();
        services.AddIntegrationEventHandler<TestEvent, TestIntegrationEventHandler>();
        services.AddScoped(_ => _testIntegrationEventHandler);

        _services = services.BuildServiceProvider();
    }

    [Fact]
    public async Task SentMessageReachesItsHandlerAndIsProcessed()
    {
        await SaveAsync(OutboxMessage.Create(new TestEvent("Push"), Now));

        await ProcessAsync();

        _testIntegrationEventHandler.Received.ShouldBe([new TestEvent("Push")]);
        OutboxMessage message = await ReadSingleAsync();
        message.ProcessedAtUtc.ShouldBe(Now);
    }

    [Fact]
    public async Task FailedMessageKeepsItsErrorAndWaits()
    {
        _testIntegrationEventHandler.FailWith = "Database is down.";
        await SaveAsync(OutboxMessage.Create(new TestEvent("Push"), Now));

        await ProcessAsync();

        OutboxMessage message = await ReadSingleAsync();
        message.ProcessedAtUtc.ShouldBeNull();
        message.Attempts.ShouldBe(1);
        message.Error.ShouldBe("Database is down.");
    }

    [Fact]
    public async Task MessageIsNotSentAfterItsLastAttempt()
    {
        OutboxMessage message = OutboxMessage.Create(new TestEvent("Push"), Now);
        for (int attempt = 0; attempt < OutboxProcessor<TestDbContext>.MaxAttempts; attempt++)
        {
            message.MarkFailed("Database is down.");
        }

        await SaveAsync(message);

        await ProcessAsync();

        _testIntegrationEventHandler.Received.ShouldBeEmpty();
    }

    [Fact]
    public async Task MessageWithoutHandlersIsProcessed()
    {
        await SaveAsync(OutboxMessage.Create("nobody listens", Now));

        await ProcessAsync();

        (await ReadSingleAsync()).ProcessedAtUtc.ShouldBe(Now);
    }

    [Fact]
    public void AddOutboxRegistersTheJob()
    {
        _services.GetServices<IHostedService>().ShouldHaveSingleItem().ShouldBeOfType<OutboxProcessor<TestDbContext>>();
    }

    public ValueTask DisposeAsync() => _services.DisposeAsync();

    private async Task SaveAsync(OutboxMessage message)
    {
        await using AsyncServiceScope scope = _services.CreateAsyncScope();
        TestDbContext dbContext = scope.ServiceProvider.GetRequiredService<TestDbContext>();
        dbContext.Add(message);
        await dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
    }

    private Task ProcessAsync() =>
        _services.GetServices<IHostedService>().OfType<OutboxProcessor<TestDbContext>>().Single().ProcessAsync(TestContext.Current.CancellationToken);

    private async Task<OutboxMessage> ReadSingleAsync()
    {
        await using AsyncServiceScope scope = _services.CreateAsyncScope();

        return await scope.ServiceProvider.GetRequiredService<TestDbContext>().Set<OutboxMessage>().SingleAsync(TestContext.Current.CancellationToken);
    }

    private sealed class TestIntegrationEventHandler : IIntegrationEventHandler<TestEvent>
    {
        public List<TestEvent> Received { get; } = [];

        public string? FailWith { get; set; }

        public Task HandleAsync(TestEvent @event, CancellationToken cancellationToken)
        {
            if (FailWith is not null)
            {
                throw new InvalidOperationException(FailWith);
            }

            Received.Add(@event);

            return Task.CompletedTask;
        }
    }
}
