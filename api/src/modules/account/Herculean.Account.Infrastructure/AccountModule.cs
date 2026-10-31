using FluentValidation;

using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Users.CreateUser;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure.Auth;
using Herculean.Account.Infrastructure.Users;
using Herculean.SharedKernel.Events;
using Herculean.SharedKernel.Persistence;

using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
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
        builder.Services.AddScoped<IUnitOfWork>(services => services.GetRequiredService<AccountDbContext>());
        builder.Services.AddScoped<IOutbox, Outbox>();
        builder.Services.AddOutbox<AccountDbContext>();

        builder.Services.AddOptions<JwtOptions>()
            .BindConfiguration(JwtOptions.Section)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
        builder.Services.AddSingleton<ITokenIssuer, JwtTokenIssuer>();
        builder.Services.AddScoped<IUserRepository, UserRepository>();

        builder.Services.AddScoped<IValidator<CreateUserRequest>, CreateUserValidator>();
        builder.Services.AddScoped<CreateUserHandler>();
    }

    /// <summary>Maps every Account endpoint.</summary>
    /// <param name="endpoints">The API's endpoints.</param>
    public static void MapAccountModuleEndpoints(this IEndpointRouteBuilder endpoints)
    {
        CreateUserEndpoint.Map(endpoints);
    }

    /// <summary>Applies the Account module's pending migrations.</summary>
    /// <param name="services">The API's services.</param>
    /// <param name="cancellationToken">Stops the migration.</param>
    public static Task MigrateAccountModuleDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        return services.MigrateDatabaseAsync<AccountDbContext>(cancellationToken);
    }
}
