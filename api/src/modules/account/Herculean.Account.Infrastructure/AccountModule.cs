using System.Globalization;
using System.Threading.RateLimiting;

using FluentValidation;

using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Sessions;
using Herculean.Account.Application.Sessions.CreateSession;
using Herculean.Account.Application.Sessions.RefreshSession;
using Herculean.Account.Application.Users.CreateUser;
using Herculean.Account.Application.Users.GetCurrentUser;
using Herculean.Account.Application.Users.UpdateCurrentUser;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure.Auth;
using Herculean.Account.Infrastructure.Users;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Events;
using Herculean.SharedKernel.Persistence;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Herculean.Account.Infrastructure;

/// <summary>The Account module: users, sign in and tokens. The only way into the module.</summary>
public static class AccountModule
{
    private const int SessionAttemptsPerMinute = 10;

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

        // Account issues the access tokens, so it also tells the API how to check them.
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        builder.Services.AddSingleton<IConfigureOptions<JwtBearerOptions>, JwtBearerSetup>();
        builder.Services.AddCurrentUserAccessor();
        builder.Services.AddScoped<CurrentUser>();

        builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
        builder.Services.AddSingleton<ITokenIssuer, JwtTokenIssuer>();
        builder.Services.AddScoped<IUserRepository, UserRepository>();

        builder.Services.AddScoped<IValidator<CreateUserRequest>, CreateUserValidator>();
        builder.Services.AddScoped<CreateUserHandler>();
        builder.Services.AddScoped<IValidator<UpdateCurrentUserRequest>, UpdateCurrentUserValidator>();
        builder.Services.AddScoped<UpdateCurrentUserHandler>();
        builder.Services.AddScoped<GetCurrentUserHandler>();
        builder.Services.AddScoped<IValidator<CreateSessionRequest>, CreateSessionValidator>();
        builder.Services.AddScoped<CreateSessionHandler>();
        builder.Services.AddScoped<IValidator<RefreshSessionRequest>, RefreshSessionValidator>();
        builder.Services.AddScoped<RefreshSessionHandler>();

        // Sign in and refresh each allow a few tries a minute per IP address, against guessing passwords and tokens.
        builder.Services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = (context, _) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out TimeSpan retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
                }

                return ValueTask.CompletedTask;
            };
            options.AddPolicy(SessionRoutes.SignInRateLimit, SessionAttemptsPerIp);
            options.AddPolicy(SessionRoutes.RefreshRateLimit, SessionAttemptsPerIp);
        });
    }

    private static RateLimitPartition<string> SessionAttemptsPerIp(HttpContext httpContext) =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = SessionAttemptsPerMinute, Window = TimeSpan.FromMinutes(1) });

    /// <summary>Maps every Account endpoint.</summary>
    /// <param name="endpoints">The API's endpoints.</param>
    public static void MapAccountModuleEndpoints(this IEndpointRouteBuilder endpoints)
    {
        CreateUserEndpoint.Map(endpoints);
        UpdateCurrentUserEndpoint.Map(endpoints);
        GetCurrentUserEndpoint.Map(endpoints);
        CreateSessionEndpoint.Map(endpoints);
        RefreshSessionEndpoint.Map(endpoints);
    }

    /// <summary>Applies the Account module's pending migrations.</summary>
    /// <param name="services">The API's services.</param>
    /// <param name="cancellationToken">Stops the migration.</param>
    public static Task MigrateAccountModuleDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        return services.MigrateDatabaseAsync<AccountDbContext>(cancellationToken);
    }
}
