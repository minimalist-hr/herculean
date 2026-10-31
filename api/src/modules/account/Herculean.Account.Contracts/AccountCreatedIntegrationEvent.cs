namespace Herculean.Account.Contracts;

/// <summary>A new account was created.</summary>
/// <param name="UserId">The new user's ID.</param>
public sealed record AccountCreatedIntegrationEvent(Guid UserId);
