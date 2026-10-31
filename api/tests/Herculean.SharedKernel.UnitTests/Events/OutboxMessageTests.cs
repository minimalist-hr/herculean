using Herculean.SharedKernel.Events;

namespace Herculean.SharedKernel.UnitTests.Events;

public sealed class OutboxMessageTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 31, 18, 0, 0, TimeSpan.Zero);

    [Fact]
    public void CreateStoresTheEventTypeAndJson()
    {
        OutboxMessage message = OutboxMessage.Create(new TestEvent("Push"), Now);

        message.Type.ShouldBe(typeof(TestEvent).FullName);
        message.Content.ShouldBe("""{"name":"Push"}""");
        message.OccurredAtUtc.ShouldBe(Now);
        message.ProcessedAtUtc.ShouldBeNull();
        message.Attempts.ShouldBe(0);
    }

    [Fact]
    public void FailedThenProcessedClearsTheError()
    {
        OutboxMessage message = OutboxMessage.Create(new TestEvent("Push"), Now);

        message.MarkFailed("Database is down.");
        message.MarkProcessed(Now.AddMinutes(1));

        message.Attempts.ShouldBe(1);
        message.Error.ShouldBeNull();
        message.ProcessedAtUtc.ShouldBe(Now.AddMinutes(1));
    }
}
