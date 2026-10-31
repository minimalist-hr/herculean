using Microsoft.AspNetCore.Http;

namespace Herculean.SharedKernel.Auth;

internal sealed class CurrentUserAccessor(IHttpContextAccessor httpContextAccessor) : ICurrentUserAccessor
{
    internal const string SubjectClaim = "sub";

    public Guid UserId =>
        Guid.TryParse(httpContextAccessor.HttpContext?.User.FindFirst(SubjectClaim)?.Value, out Guid userId)
            ? userId
            : throw new InvalidOperationException("No user is signed in. Only endpoints that require a signed-in user can read the current user.");
}
