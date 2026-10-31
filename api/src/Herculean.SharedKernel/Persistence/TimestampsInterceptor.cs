using Herculean.SharedKernel.Entities;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Herculean.SharedKernel.Persistence;

internal sealed class TimestampsInterceptor(TimeProvider timeProvider) : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        SetTimestamps(eventData.Context);

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        SetTimestamps(eventData.Context);

        return base.SavingChanges(eventData, result);
    }

    private void SetTimestamps(DbContext? context)
    {
        DateTimeOffset now = timeProvider.GetUtcNow();

        foreach (var entry in context?.ChangeTracker.Entries<Entity>() ?? [])
        {
            if (entry.State == EntityState.Added)
            {
                entry.Property(entity => entity.CreatedAtUtc).CurrentValue = now;
                entry.Property(entity => entity.UpdatedAtUtc).CurrentValue = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Property(entity => entity.UpdatedAtUtc).CurrentValue = now;
            }
        }
    }
}
