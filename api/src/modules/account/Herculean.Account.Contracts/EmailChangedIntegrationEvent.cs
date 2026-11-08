namespace Herculean.Account.Contracts;

/// <summary>A user's new email is confirmed and active.</summary>
/// <param name="UserId">The user.</param>
/// <param name="OldEmail">The address the account used until now.</param>
/// <param name="ChangedAtUtc">When the email changed.</param>
public sealed record EmailChangedIntegrationEvent(Guid UserId, string OldEmail, DateTimeOffset ChangedAtUtc);
