using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure.Users;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Account.Infrastructure;

internal sealed class AccountDbContext(DbContextOptions<AccountDbContext> options) : DbContext(options), IUnitOfWork
{
    internal const string Schema = "account";

    public DbSet<User> Users => Set<User>();

    Task IUnitOfWork.SaveChangesAsync(CancellationToken cancellationToken) => SaveChangesAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new RefreshTokenConfiguration());
    }
}
