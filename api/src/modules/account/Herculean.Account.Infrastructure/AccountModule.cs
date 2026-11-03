using System.Globalization;
using System.Threading.RateLimiting;

using FluentValidation;

using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Email;
using Herculean.Account.Application.PasswordResets;
using Herculean.Account.Application.PasswordResets.CompletePasswordReset;
using Herculean.Account.Application.PasswordResets.CreatePasswordReset;
using Herculean.Account.Application.PasswordResets.OpenResetLink;
using Herculean.Account.Application.PasswordResets.SendPasswordResetEmail;
using Herculean.Account.Application.Sessions;
using Herculean.Account.Application.Sessions.CreateSession;
using Herculean.Account.Application.Sessions.RefreshSession;
using Herculean.Account.Application.Users.CreateUser;
using Herculean.Account.Application.Users;
using Herculean.Account.Application.Users.GetCurrentUser;
using Herculean.Account.Application.Users.GetUserTimeZone;
using Herculean.Account.Application.Users.UpdateCurrentUser;
using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure.Auth;
using Herculean.Account.Infrastructure.Email;
using Herculean.Account.Infrastructure.PasswordResets;
using Herculean.Account.Infrastructure.Users;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Events;
using Herculean.SharedKernel.Persistence;
using Herculean.SharedKernel.Queries;

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
    private const int AttemptsPerMinute = 10;

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
        builder.Services.AddOptions<TokensOptions>()
            .BindConfiguration(TokensOptions.Section)
            .ValidateDataAnnotations()
            .ValidateOnStart();
        builder.Services.AddOptions<EmailOptions>()
            .BindConfiguration(EmailOptions.Section)
            .ValidateDataAnnotations()
            .ValidateOnStart();
        builder.Services.AddOptions<LinksOptions>()
            .BindConfiguration(LinksOptions.Section)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // Account issues the access tokens, so it also tells the API how to check them.
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        builder.Services.AddSingleton<IConfigureOptions<JwtBearerOptions>, JwtBearerSetup>();
        builder.Services.AddCurrentUserAccessor();
        builder.Services.AddScoped<CurrentUser>();

        builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
        builder.Services.AddSingleton<ITokenIssuer, JwtTokenIssuer>();
        builder.Services.AddSingleton<IPasswordResetTokenIssuer, PasswordResetTokenIssuer>();
        builder.Services.AddSingleton<IResetLinks, ResetLinks>();
        builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
        builder.Services.AddSingleton<PasswordResetQueue>();
        builder.Services.AddSingleton<IPasswordResetQueue>(services => services.GetRequiredService<PasswordResetQueue>());
        builder.Services.AddHostedService<PasswordResetEmailJob>();
        builder.Services.AddScoped<IUserRepository, UserRepository>();
        builder.Services.AddScoped<IUserReadRepository, UserReadRepository>();
        builder.Services.AddScoped<IQueryHandler<GetUserTimeZoneQuery, string>, GetUserTimeZoneQueryHandler>();

        builder.Services.AddScoped<IValidator<CreateUserRequest>, CreateUserValidator>();
        builder.Services.AddScoped<CreateUserHandler>();
        builder.Services.AddScoped<IValidator<UpdateCurrentUserRequest>, UpdateCurrentUserValidator>();
        builder.Services.AddScoped<UpdateCurrentUserHandler>();
        builder.Services.AddScoped<GetCurrentUserHandler>();
        builder.Services.AddScoped<IValidator<CreateSessionRequest>, CreateSessionValidator>();
        builder.Services.AddScoped<CreateSessionHandler>();
        builder.Services.AddScoped<IValidator<RefreshSessionRequest>, RefreshSessionValidator>();
        builder.Services.AddScoped<RefreshSessionHandler>();
        builder.Services.AddScoped<IValidator<CreatePasswordResetRequest>, CreatePasswordResetValidator>();
        builder.Services.AddScoped<CreatePasswordResetHandler>();
        builder.Services.AddScoped<SendPasswordResetEmailHandler>();
        builder.Services.AddScoped<OpenResetLinkHandler>();
        builder.Services.AddScoped<IValidator<CompletePasswordResetRequest>, CompletePasswordResetValidator>();
        builder.Services.AddScoped<CompletePasswordResetHandler>();

        // Each allows a few tries a minute per IP address, against guessing passwords and tokens and sending too many emails.
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
            options.AddPolicy(SessionRoutes.SignInRateLimit, AttemptsPerIp);
            options.AddPolicy(SessionRoutes.RefreshRateLimit, AttemptsPerIp);
            options.AddPolicy(PasswordResetRoutes.CreateRateLimit, AttemptsPerIp);
            options.AddPolicy(PasswordResetRoutes.CompleteRateLimit, AttemptsPerIp);
        });
    }

    private static RateLimitPartition<string> AttemptsPerIp(HttpContext httpContext) =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = AttemptsPerMinute, Window = TimeSpan.FromMinutes(1) });

    /// <summary>Maps every Account endpoint.</summary>
    /// <param name="endpoints">The API's endpoints.</param>
    public static void MapAccountModuleEndpoints(this IEndpointRouteBuilder endpoints)
    {
        CreateUserEndpoint.Map(endpoints);
        UpdateCurrentUserEndpoint.Map(endpoints);
        GetCurrentUserEndpoint.Map(endpoints);
        CreateSessionEndpoint.Map(endpoints);
        RefreshSessionEndpoint.Map(endpoints);
        CreatePasswordResetEndpoint.Map(endpoints);
        OpenResetLinkEndpoint.Map(endpoints);
        CompletePasswordResetEndpoint.Map(endpoints);
    }

    /// <summary>Applies the Account module's pending migrations.</summary>
    /// <param name="services">The API's services.</param>
    /// <param name="cancellationToken">Stops the migration.</param>
    public static Task MigrateAccountModuleDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        return services.MigrateDatabaseAsync<AccountDbContext>(cancellationToken);
    }
}
