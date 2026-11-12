namespace Herculean.Account.Contracts;

/// <summary>Minimalist closed an account for breaking the terms. It gets deleted after a wait.</summary>
/// <param name="Email">The address the account uses.</param>
/// <param name="DeleteAtUtc">When the account gets deleted.</param>
/// <param name="TimeZone">The user's IANA time zone, which the email shows the day in.</param>
public sealed record AccountClosedIntegrationEvent(string Email, DateTimeOffset DeleteAtUtc, string TimeZone);
