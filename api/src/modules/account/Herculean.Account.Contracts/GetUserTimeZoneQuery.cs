namespace Herculean.Account.Contracts;

/// <summary>Asks for a user's IANA time zone. The user must exist.</summary>
/// <param name="UserId">The user's ID.</param>
public sealed record GetUserTimeZoneQuery(Guid UserId);
