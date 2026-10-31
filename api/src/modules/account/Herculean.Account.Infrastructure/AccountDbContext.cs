using Microsoft.EntityFrameworkCore;

namespace Herculean.Account.Infrastructure;

internal sealed class AccountDbContext(DbContextOptions<AccountDbContext> options) : DbContext(options)
{
    internal const string Schema = "account";

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
    }
}
