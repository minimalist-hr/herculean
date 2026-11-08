namespace Herculean.Account.Contracts;

/// <summary>A user asked to change their email, or for the link again.</summary>
/// <param name="UserId">The user.</param>
/// <param name="NewEmail">The address to confirm.</param>
public sealed record EmailChangeRequestedIntegrationEvent(Guid UserId, string NewEmail);
