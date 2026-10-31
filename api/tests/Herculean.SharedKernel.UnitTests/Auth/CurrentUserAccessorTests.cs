using System.Security.Claims;

using Herculean.SharedKernel.Auth;

using Microsoft.AspNetCore.Http;

namespace Herculean.SharedKernel.UnitTests.Auth;

public sealed class CurrentUserAccessorTests
{
    [Fact]
    public void UserIdComesFromTheSubjectClaim()
    {
        Guid userId = Guid.CreateVersion7();
        CurrentUserAccessor accessor = For(new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", userId.ToString())], "Bearer")));

        accessor.UserId.ShouldBe(userId);
    }

    [Fact]
    public void ReadingItWithoutASignedInUserIsABug()
    {
        CurrentUserAccessor accessor = For(new ClaimsPrincipal(new ClaimsIdentity()));

        Should.Throw<InvalidOperationException>(() => accessor.UserId);
    }

    private static CurrentUserAccessor For(ClaimsPrincipal user) =>
        new(new HttpContextAccessor { HttpContext = new DefaultHttpContext { User = user } });
}
