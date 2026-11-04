namespace Herculean.Account.Contracts;

/// <summary>Asks when a user's account was created. The user must exist.</summary>
/// <param name="UserId">The user's ID.</param>
public sealed record GetUserCreatedAtQuery(Guid UserId);
