using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure.Users;
using Herculean.SharedKernel.Events;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Account.Infrastructure;

internal sealed class AccountDbContext(DbContextOptions<AccountDbContext> options, OutboxSignal<AccountDbContext> outboxSignal)
    : DbContext(options), IUnitOfWork
{
    internal const string Schema = "account";

    public DbSet<User> Users => Set<User>();

    async Task IUnitOfWork.SaveChangesAsync(CancellationToken cancellationToken)
    {
        bool savesEvents = ChangeTracker.Entries<OutboxMessage>().Any(entry => entry.State == EntityState.Added);

        await SaveChangesAsync(cancellationToken);

        // Saved events go out now, not at the next check. Other saves leave it asleep, because each check also uses up a try of a failed event.
        if (savesEvents)
        {
            outboxSignal.Wake();
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new RefreshTokenConfiguration());
        modelBuilder.ApplyConfiguration(new PasswordResetTokenConfiguration());
        modelBuilder.ApplyConfiguration(new EmailChangeTokenConfiguration());
        modelBuilder.ApplyConfiguration(new UserPhotoConfiguration());
        modelBuilder.ApplyConfiguration(new OutboxMessageConfiguration());
    }
}
