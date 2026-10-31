namespace Herculean.SharedKernel.Auth;

/// <summary>Who is calling, read from the access token's <c>sub</c> claim. Each module wraps it in its own <c>UserId</c>.</summary>
public interface ICurrentUserAccessor
{
    /// <summary>The signed-in user's ID.</summary>
    /// <exception cref="InvalidOperationException">No user is signed in: the endpoint allows anonymous calls.</exception>
    Guid UserId { get; }
}
