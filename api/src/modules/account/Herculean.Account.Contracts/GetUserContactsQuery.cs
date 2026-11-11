namespace Herculean.Account.Contracts;

/// <summary>Asks for how to name and reach users. A user that no longer exists is left out.</summary>
/// <param name="UserIds">The users' IDs.</param>
public sealed record GetUserContactsQuery(IReadOnlyCollection<Guid> UserIds);

/// <summary>How to name and reach a user.</summary>
/// <param name="UserId">The user's ID.</param>
/// <param name="Name">The user's name, or null before setup.</param>
/// <param name="Email">The user's email.</param>
public sealed record UserContact(Guid UserId, string? Name, string Email);
