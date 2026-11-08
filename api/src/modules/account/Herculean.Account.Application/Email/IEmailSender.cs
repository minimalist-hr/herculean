namespace Herculean.Account.Application.Email;

internal interface IEmailSender
{
    Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken);

    /// <param name="email">Where it goes.</param>
    /// <param name="changedAtUtc">When the password changed.</param>
    /// <param name="timeZone">The user's IANA time zone, which the email shows the time in.</param>
    /// <param name="cancellationToken">Stops the send.</param>
    Task SendPasswordChangedAsync(string email, DateTimeOffset changedAtUtc, string timeZone, CancellationToken cancellationToken);
}
