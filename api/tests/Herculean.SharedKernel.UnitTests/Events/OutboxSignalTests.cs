using Herculean.SharedKernel.Events;

namespace Herculean.SharedKernel.UnitTests.Events;

public sealed class OutboxSignalTests : IDisposable
{
    private readonly OutboxSignal<TestDbContext> _outboxSignal = new();

    [Fact]
    public async Task WakeEndsTheWait()
    {
        _outboxSignal.Wake();

        (await _outboxSignal.WaitAsync(TimeSpan.Zero, TestContext.Current.CancellationToken)).ShouldBeTrue();
    }

    [Fact]
    public async Task WithoutAWakeTheWaitTimesOut()
    {
        (await _outboxSignal.WaitAsync(TimeSpan.Zero, TestContext.Current.CancellationToken)).ShouldBeFalse();
    }

    [Fact]
    public async Task SeveralWakesCountAsOne()
    {
        _outboxSignal.Wake();
        _outboxSignal.Wake();

        (await _outboxSignal.WaitAsync(TimeSpan.Zero, TestContext.Current.CancellationToken)).ShouldBeTrue();
        (await _outboxSignal.WaitAsync(TimeSpan.Zero, TestContext.Current.CancellationToken)).ShouldBeFalse();
    }

    public void Dispose()
    {
        _outboxSignal.Dispose();
    }
}
