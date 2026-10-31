using Microsoft.EntityFrameworkCore;

namespace Herculean.SharedKernel.Events;

/// <summary>Wakes a module's outbox job right after a save, so events don't wait for the next check.</summary>
/// <typeparam name="TContext">The module's DbContext.</typeparam>
public sealed class OutboxSignal<TContext> : IDisposable
    where TContext : DbContext
{
    private readonly SemaphoreSlim _semaphore = new(0, 1);

    /// <summary>Wakes the job. Several wakes before it runs count as one.</summary>
    public void Wake()
    {
        try
        {
            _semaphore.Release();
        }
        catch (SemaphoreFullException)
        {
            // Already awake.
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        _semaphore.Dispose();
    }

    internal Task<bool> WaitAsync(TimeSpan timeout, CancellationToken cancellationToken) => _semaphore.WaitAsync(timeout, cancellationToken);
}
