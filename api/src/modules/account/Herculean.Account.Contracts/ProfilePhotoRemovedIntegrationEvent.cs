namespace Herculean.Account.Contracts;

/// <summary>Minimalist removed a user's profile photo for breaking the terms.</summary>
/// <param name="Email">The address the account uses.</param>
public sealed record ProfilePhotoRemovedIntegrationEvent(string Email);
