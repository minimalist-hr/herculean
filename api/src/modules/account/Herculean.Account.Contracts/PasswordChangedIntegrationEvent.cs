namespace Herculean.Account.Contracts;

/// <summary>A user changed their password.</summary>
/// <param name="UserId">The user.</param>
/// <param name="ChangedAtUtc">When the password changed.</param>
/// <param name="WithResetLink">Whether a reset link changed it, which signs out every device.</param>
public sealed record PasswordChangedIntegrationEvent(Guid UserId, DateTimeOffset ChangedAtUtc, bool WithResetLink = false);
