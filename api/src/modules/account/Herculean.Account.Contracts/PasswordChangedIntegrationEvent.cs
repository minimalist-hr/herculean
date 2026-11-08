namespace Herculean.Account.Contracts;

/// <summary>A user changed their password.</summary>
/// <param name="UserId">The user.</param>
/// <param name="ChangedAtUtc">When the password changed.</param>
public sealed record PasswordChangedIntegrationEvent(Guid UserId, DateTimeOffset ChangedAtUtc);
