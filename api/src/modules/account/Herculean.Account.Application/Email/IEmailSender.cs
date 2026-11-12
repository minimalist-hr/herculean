namespace Herculean.Account.Application.Email;

internal interface IEmailSender
{
    Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken);

    /// <param name="email">Where it goes.</param>
    /// <param name="changedAtUtc">When the password changed.</param>
    /// <param name="timeZone">The user's IANA time zone, which the email shows the time in.</param>
    /// <param name="cancellationToken">Stops the send.</param>
    Task SendPasswordChangedAsync(string email, DateTimeOffset changedAtUtc, string timeZone, CancellationToken cancellationToken);

    /// <param name="email">The address the account used.</param>
    /// <param name="deletedAtUtc">When the account was deleted.</param>
    /// <param name="timeZone">The user's IANA time zone, which the email shows the time in.</param>
    /// <param name="cancellationToken">Stops the send.</param>
    Task SendAccountDeletedAsync(string email, DateTimeOffset deletedAtUtc, string timeZone, CancellationToken cancellationToken);

    /// <param name="email">The address the account uses.</param>
    /// <param name="deleteAtUtc">When the account gets deleted.</param>
    /// <param name="timeZone">The user's IANA time zone, which the email shows the day in.</param>
    /// <param name="cancellationToken">Stops the send.</param>
    Task SendAccountDeletionScheduledAsync(string email, DateTimeOffset deleteAtUtc, string timeZone, CancellationToken cancellationToken);

    /// <param name="email">The address the account uses.</param>
    /// <param name="deleteAtUtc">When the account gets deleted.</param>
    /// <param name="timeZone">The user's IANA time zone, which the email shows the day in.</param>
    /// <param name="cancellationToken">Stops the send.</param>
    Task SendAccountClosedAsync(string email, DateTimeOffset deleteAtUtc, string timeZone, CancellationToken cancellationToken);

    Task SendProfilePhotoRemovedAsync(string email, CancellationToken cancellationToken);

    Task SendEmailChangeAsync(string newEmail, string token, CancellationToken cancellationToken);

    /// <param name="oldEmail">The address the account used until now.</param>
    /// <param name="changedAtUtc">When the email changed.</param>
    /// <param name="timeZone">The user's IANA time zone, which the email shows the time in.</param>
    /// <param name="cancellationToken">Stops the send.</param>
    Task SendEmailChangedAsync(string oldEmail, DateTimeOffset changedAtUtc, string timeZone, CancellationToken cancellationToken);
}
