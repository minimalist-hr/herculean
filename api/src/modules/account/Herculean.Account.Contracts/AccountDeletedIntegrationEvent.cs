namespace Herculean.Account.Contracts;

/// <summary>A user deleted their account, so every module deletes what it holds for them.</summary>
/// <param name="UserId">The user.</param>
public sealed record AccountDeletedIntegrationEvent(Guid UserId);
