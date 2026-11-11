using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Users.CreateUser;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;

using Microsoft.Extensions.Logging;

namespace Herculean.Account.Application.Users.SeedAdmins;

/// <summary>
/// Makes each admin account in configuration that doesn't exist yet, with its password.
/// A changed password replaces the old one, so it is changed in configuration. Running it again changes nothing.
/// </summary>
internal sealed partial class SeedAdminsHandler(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    IUnitOfWork unitOfWork,
    ILogger<SeedAdminsHandler> logger)
{
    public async Task HandleAsync(IEnumerable<AdminCredentials> admins, CancellationToken cancellationToken)
    {
        foreach (AdminCredentials admin in admins.DistinctBy(admin => User.NormalizeEmail(admin.Email)))
        {
            // Never the email or the password: neither is ever logged.
            if (string.IsNullOrWhiteSpace(admin.Email) || admin.Password.Length is < CreateUserValidator.PasswordMinLength or > CreateUserValidator.PasswordMaxLength)
            {
                LogInvalid(logger);
                continue;
            }

            User? existing = await userRepository.GetByEmailAsync(User.NormalizeEmail(admin.Email), cancellationToken);
            if (existing is null)
            {
                userRepository.Add(User.CreateAdmin(admin.Email, passwordHasher.Hash(admin.Password)));
            }
            else if (!existing.IsAdmin)
            {
                LogRegularAccount(logger);
            }
            else if (passwordHasher.Verify(existing.PasswordHash, admin.Password) != PasswordVerification.Success)
            {
                existing.ChangePasswordHash(passwordHasher.Hash(admin.Password));
            }
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "An admin account in configuration has no email, or a password that isn't 8 to 128 characters, so it was left out.")]
    private static partial void LogInvalid(ILogger logger);

    [LoggerMessage(Level = LogLevel.Warning, Message = "An admin email in configuration belongs to a regular account, which stays as it is.")]
    private static partial void LogRegularAccount(ILogger logger);
}
