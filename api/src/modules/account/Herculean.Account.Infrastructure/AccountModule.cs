using System.Globalization;
using System.Threading.RateLimiting;

using FluentValidation;

using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Email;
using Herculean.Account.Application.EmailChanges;
using Herculean.Account.Application.EmailChanges.ConfirmEmailChange;
using Herculean.Account.Application.EmailChanges.EmailChanged;
using Herculean.Account.Application.EmailChanges.EmailChangeRequested;
using Herculean.Account.Application.EmailChanges.GetPendingEmailChange;
using Herculean.Account.Application.EmailChanges.OpenConfirmEmailLink;
using Herculean.Account.Application.EmailChanges.RequestEmailChange;
using Herculean.Account.Application.EmailChanges.ResendEmailChange;
using Herculean.Account.Application.PasswordResets;
using Herculean.Account.Application.PasswordResets.CompletePasswordReset;
using Herculean.Account.Application.PasswordResets.CreatePasswordReset;
using Herculean.Account.Application.PasswordResets.OpenResetLink;
using Herculean.Account.Application.PasswordResets.SendPasswordResetEmail;
using Herculean.Account.Application.Sessions;
using Herculean.Account.Application.Sessions.CreateSession;
using Herculean.Account.Application.Sessions.RefreshSession;
using Herculean.Account.Application.Sessions.RestoreAccount;
using Herculean.Account.Application.Sessions.RevokeSession;
using Herculean.Account.Application.Users.AccountDeletionNotice;
using Herculean.Account.Application.Users.AccountKept;
using Herculean.Account.Application.Users.AccountDeletionScheduled;
using Herculean.Account.Application.Users.DeleteCurrentUser;
using Herculean.Account.Application.Users.DeleteCurrentUserPhoto;
using Herculean.Account.Application.Users.GetCurrentUserPhoto;
using Herculean.Account.Application.Users.SaveCurrentUserPhoto;
using Herculean.Account.Application.Users.DeleteDueAccounts;
using Herculean.Account.Application.Users.DeleteExpiredData;
using Herculean.Account.Application.Users.ChangePassword;
using Herculean.Account.Application.Users.CreateUser;
using Herculean.Account.Application.Users;
using Herculean.Account.Application.Users.GetCurrentUser;
using Herculean.Account.Application.Users.GetUserCreatedAt;
using Herculean.Account.Application.Users.GetUserTimeZone;
using Herculean.Account.Application.Users.GetUserStats;
using Herculean.Account.Application.Users.ListUsers;
using Herculean.Account.Application.Users.GetUser;
using Herculean.Account.Application.Users.SignOutUser;
using Herculean.Account.Application.Users.SendUserPasswordReset;
using Herculean.Account.Application.Users.AccountClosed;
using Herculean.Account.Application.Users.CloseUserAccount;
using Herculean.Account.Application.Users.GetUserPhoto;
using Herculean.Account.Application.Users.ProfilePhotoRemoved;
using Herculean.Account.Application.Users.RemoveUserPhoto;
using Herculean.Account.Application.Users.CancelUserDeletion;
using Herculean.Account.Application.Users.SeedAdmins;
using Herculean.Account.Application.Users.GetUserContacts;
using Herculean.Account.Application.Users.PasswordChanged;
using Herculean.Account.Application.Users.UpdateCurrentUser;
using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure.Auth;
using Herculean.Account.Infrastructure.Email;
using Herculean.Account.Infrastructure.PasswordResets;
using Herculean.Account.Infrastructure.Users;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Configuration;
using Herculean.SharedKernel.Events;
using Herculean.SharedKernel.Health;
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
            .ValidateWhenRunning();
        builder.Services.AddOptions<TokensOptions>()
            .BindConfiguration(TokensOptions.Section)
            .ValidateDataAnnotations()
            .ValidateWhenRunning();
        builder.Services.AddOptions<EmailOptions>()
            .BindConfiguration(EmailOptions.Section)
            .ValidateDataAnnotations()
            .ValidateWhenRunning();
        builder.Services.AddOptions<AdminOptions>()
            .BindConfiguration(AdminOptions.Section);
        builder.Services.AddOptions<LinksOptions>()
            .BindConfiguration(LinksOptions.Section)
            .ValidateDataAnnotations()
            .ValidateWhenRunning();

        // Account issues the access tokens, so it also tells the API how to check them.
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        builder.Services.AddSingleton<IConfigureOptions<JwtBearerOptions>, JwtBearerSetup>();
        builder.Services.AddCurrentUserAccessor();
        builder.Services.AddScoped<CurrentUser>();

        builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
        builder.Services.AddSingleton<ITokenIssuer, JwtTokenIssuer>();
        builder.Services.AddSingleton<IPasswordResetTokenIssuer, PasswordResetTokenIssuer>();
        builder.Services.AddSingleton<IEmailChangeTokenIssuer, EmailChangeTokenIssuer>();
        builder.Services.AddSingleton<IResetLinks, ResetLinks>();
        builder.Services.AddSingleton<IEmailChangeLinks, EmailChangeLinks>();
        builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
        builder.Services.AddSingleton<PasswordResetQueue>();
        builder.Services.AddSingleton<IPasswordResetQueue>(services => services.GetRequiredService<PasswordResetQueue>());
        builder.Services.AddHostedService<PasswordResetEmailJob>();
        builder.Services.AddScoped<IUserRepository, UserRepository>();
        builder.Services.AddScoped<IUserReadRepository, UserReadRepository>();
        builder.Services.AddScoped<IQueryHandler<GetUserTimeZoneQuery, string>, GetUserTimeZoneQueryHandler>();
        builder.Services.AddScoped<IQueryHandler<GetUserCreatedAtQuery, DateTimeOffset>, GetUserCreatedAtQueryHandler>();
        builder.Services.AddScoped<IQueryHandler<GetUserContactsQuery, IReadOnlyList<UserContact>>, GetUserContactsQueryHandler>();
        builder.Services.AddScoped<SeedAdminsHandler>();
        builder.Services.AddScoped<GetUserStatsHandler>();
        builder.Services.AddScoped<ListUsersHandler>();
        builder.Services.AddScoped<GetUserHandler>();
        builder.Services.AddScoped<SignOutUserHandler>();
        builder.Services.AddScoped<SendUserPasswordResetHandler>();
        builder.Services.AddScoped<CloseUserAccountHandler>();
        builder.Services.AddScoped<RemoveUserPhotoHandler>();
        builder.Services.AddScoped<GetUserPhotoHandler>();
        builder.Services.AddScoped<CancelUserDeletionHandler>();
        builder.Services.AddSingleton<DeletionJobRuns>();
        builder.Services.AddHealthChecks()
            .AddDatabaseCheck<AccountDbContext>()
            .AddCheck<EmailHealthCheck>("Email", tags: [SystemHealth.Tag])
            .AddOutboxCheck<AccountDbContext>()
            .AddCheck<DeletionJobHealthCheck>("Deletion job", tags: [SystemHealth.Tag]);
        builder.Services.AddHostedService<AdminSeedJob>();

        builder.Services.AddScoped<IValidator<CreateUserRequest>, CreateUserValidator>();
        builder.Services.AddScoped<IValidator<ListUsersRequest>, ListUsersValidator>();
        builder.Services.AddScoped<CreateUserHandler>();
        builder.Services.AddScoped<IValidator<UpdateCurrentUserRequest>, UpdateCurrentUserValidator>();
        builder.Services.AddScoped<UpdateCurrentUserHandler>();
        builder.Services.AddScoped<IValidator<ChangePasswordRequest>, ChangePasswordValidator>();
        builder.Services.AddScoped<ChangePasswordHandler>();
        builder.Services.AddIntegrationEventHandler<PasswordChangedIntegrationEvent, PasswordChangedIntegrationEventHandler>();
        builder.Services.AddScoped<GetCurrentUserHandler>();
        builder.Services.AddScoped<IValidator<CreateSessionRequest>, CreateSessionValidator>();
        builder.Services.AddScoped<CreateSessionHandler>();
        builder.Services.AddScoped<IValidator<RefreshSessionRequest>, RefreshSessionValidator>();
        builder.Services.AddScoped<RefreshSessionHandler>();
        builder.Services.AddScoped<IValidator<RevokeSessionRequest>, RevokeSessionValidator>();
        builder.Services.AddScoped<RevokeSessionHandler>();
        builder.Services.AddScoped<IValidator<RestoreAccountRequest>, RestoreAccountValidator>();
        builder.Services.AddScoped<RestoreAccountHandler>();
        builder.Services.AddScoped<DeleteDueAccountsHandler>();
        builder.Services.AddScoped<DeleteExpiredDataHandler>();
        builder.Services.AddScoped<GetCurrentUserPhotoHandler>();
        builder.Services.AddScoped<IValidator<SaveCurrentUserPhotoRequest>, SaveCurrentUserPhotoValidator>();
        builder.Services.AddScoped<SaveCurrentUserPhotoHandler>();
        builder.Services.AddScoped<DeleteCurrentUserPhotoHandler>();
        builder.Services.AddHostedService<AccountDeletionJob>();
        builder.Services.AddIntegrationEventHandler<AccountDeletionScheduledIntegrationEvent, AccountDeletionScheduledIntegrationEventHandler>();
        builder.Services.AddIntegrationEventHandler<AccountClosedIntegrationEvent, AccountClosedIntegrationEventHandler>();
        builder.Services.AddIntegrationEventHandler<ProfilePhotoRemovedIntegrationEvent, ProfilePhotoRemovedIntegrationEventHandler>();
        builder.Services.AddIntegrationEventHandler<AccountKeptIntegrationEvent, AccountKeptIntegrationEventHandler>();
        builder.Services.AddScoped<IValidator<DeleteCurrentUserRequest>, DeleteCurrentUserValidator>();
        builder.Services.AddScoped<DeleteCurrentUserHandler>();
        builder.Services.AddIntegrationEventHandler<AccountDeletionNoticeRequestedIntegrationEvent, AccountDeletionNoticeRequestedIntegrationEventHandler>();
        builder.Services.AddScoped<IValidator<CreatePasswordResetRequest>, CreatePasswordResetValidator>();
        builder.Services.AddScoped<CreatePasswordResetHandler>();
        builder.Services.AddScoped<SendPasswordResetEmailHandler>();
        builder.Services.AddScoped<OpenResetLinkHandler>();
        builder.Services.AddScoped<IValidator<CompletePasswordResetRequest>, CompletePasswordResetValidator>();
        builder.Services.AddScoped<CompletePasswordResetHandler>();
        builder.Services.AddScoped<IValidator<RequestEmailChangeRequest>, RequestEmailChangeValidator>();
        builder.Services.AddScoped<RequestEmailChangeHandler>();
        builder.Services.AddScoped<GetPendingEmailChangeHandler>();
        builder.Services.AddScoped<ResendEmailChangeHandler>();
        builder.Services.AddScoped<IValidator<ConfirmEmailChangeRequest>, ConfirmEmailChangeValidator>();
        builder.Services.AddScoped<ConfirmEmailChangeHandler>();
        builder.Services.AddIntegrationEventHandler<EmailChangeRequestedIntegrationEvent, EmailChangeRequestedIntegrationEventHandler>();
        builder.Services.AddIntegrationEventHandler<EmailChangedIntegrationEvent, EmailChangedIntegrationEventHandler>();

        builder.Services.AddUniqueIndexError(UserConfiguration.EmailIndex, UserErrors.EmailTaken);

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
            options.AddPolicy(UserRoutes.CreateRateLimit, AttemptsPerIp);
            options.AddPolicy(SessionRoutes.SignInRateLimit, AttemptsPerIp);
            options.AddPolicy(SessionRoutes.RefreshRateLimit, AttemptsPerIp);
            options.AddPolicy(PasswordResetRoutes.CreateRateLimit, AttemptsPerIp);
            options.AddPolicy(PasswordResetRoutes.CompleteRateLimit, AttemptsPerIp);
            options.AddPolicy(UserRoutes.ChangePasswordRateLimit, AttemptsPerIp);
            options.AddPolicy(UserRoutes.DeleteCurrentUserRateLimit, AttemptsPerIp);
            options.AddPolicy(SessionRoutes.RevokeRateLimit, AttemptsPerIp);
            options.AddPolicy(SessionRoutes.RestoreRateLimit, AttemptsPerIp);
            options.AddPolicy(EmailChangeRoutes.RequestRateLimit, AttemptsPerIp);
            options.AddPolicy(EmailChangeRoutes.ResendRateLimit, AttemptsPerIp);
            options.AddPolicy(EmailChangeRoutes.ConfirmRateLimit, AttemptsPerIp);
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
        ChangePasswordEndpoint.Map(endpoints);
        DeleteCurrentUserEndpoint.Map(endpoints);
        GetCurrentUserPhotoEndpoint.Map(endpoints);
        SaveCurrentUserPhotoEndpoint.Map(endpoints);
        DeleteCurrentUserPhotoEndpoint.Map(endpoints);
        GetCurrentUserEndpoint.Map(endpoints);
        GetUserStatsEndpoint.Map(endpoints);
        ListUsersEndpoint.Map(endpoints);
        GetUserEndpoint.Map(endpoints);
        SignOutUserEndpoint.Map(endpoints);
        SendUserPasswordResetEndpoint.Map(endpoints);
        CloseUserAccountEndpoint.Map(endpoints);
        RemoveUserPhotoEndpoint.Map(endpoints);
        GetUserPhotoEndpoint.Map(endpoints);
        CancelUserDeletionEndpoint.Map(endpoints);
        CreateSessionEndpoint.Map(endpoints);
        RefreshSessionEndpoint.Map(endpoints);
        RevokeSessionEndpoint.Map(endpoints);
        RestoreAccountEndpoint.Map(endpoints);
        CreatePasswordResetEndpoint.Map(endpoints);
        OpenResetLinkEndpoint.Map(endpoints);
        CompletePasswordResetEndpoint.Map(endpoints);
        RequestEmailChangeEndpoint.Map(endpoints);
        GetPendingEmailChangeEndpoint.Map(endpoints);
        ResendEmailChangeEndpoint.Map(endpoints);
        ConfirmEmailChangeEndpoint.Map(endpoints);
        OpenConfirmEmailLinkEndpoint.Map(endpoints);
    }

    /// <summary>Applies the Account module's pending migrations.</summary>
    /// <param name="services">The API's services.</param>
    /// <param name="cancellationToken">Stops the migration.</param>
    public static Task MigrateAccountModuleDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        return services.MigrateDatabaseAsync<AccountDbContext>(cancellationToken);
    }
}
