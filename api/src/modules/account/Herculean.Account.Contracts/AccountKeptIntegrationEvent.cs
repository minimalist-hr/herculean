namespace Herculean.Account.Contracts;

/// <summary>Minimalist cancelled an account's deletion, so it stays, and a closed one opens again.</summary>
/// <param name="UserId">The user.</param>
public sealed record AccountKeptIntegrationEvent(Guid UserId);
