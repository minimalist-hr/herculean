namespace Herculean.Account.Contracts;

/// <summary>The last email to a deleted account. It carries what it needs, because the account is gone.</summary>
/// <param name="Email">The address the account used.</param>
/// <param name="DeletedAtUtc">When the account was deleted.</param>
/// <param name="TimeZone">The user's IANA time zone, which the email shows the time in.</param>
public sealed record AccountDeletionNoticeRequestedIntegrationEvent(string Email, DateTimeOffset DeletedAtUtc, string TimeZone);
