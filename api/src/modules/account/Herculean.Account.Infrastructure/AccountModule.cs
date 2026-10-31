using Herculean.SharedKernel.Persistence;

using Microsoft.Extensions.Hosting;

namespace Herculean.Account.Infrastructure;

/// <summary>The Account module: users, sign in and tokens. The only way into the module.</summary>
public static class AccountModule
{
    /// <summary>Registers everything the Account module needs.</summary>
    /// <param name="builder">The API's builder.</param>
    public static void AddAccountModule(this IHostApplicationBuilder builder)
    {
        builder.AddModuleDbContext<AccountDbContext>(AccountDbContext.Schema);
    }

    /// <summary>Applies the Account module's pending migrations.</summary>
    /// <param name="services">The API's services.</param>
    /// <param name="cancellationToken">Stops the migration.</param>
    public static Task MigrateAccountModuleDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        return services.MigrateDatabaseAsync<AccountDbContext>(cancellationToken);
    }
}
