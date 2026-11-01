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
        await SaveChangesAsync(cancellationToken);

        // Saved events go out now, not at the next check.
        outboxSignal.Wake();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new RefreshTokenConfiguration());
        modelBuilder.ApplyConfiguration(new PasswordResetTokenConfiguration());
        modelBuilder.ApplyConfiguration(new OutboxMessageConfiguration());
    }
}
