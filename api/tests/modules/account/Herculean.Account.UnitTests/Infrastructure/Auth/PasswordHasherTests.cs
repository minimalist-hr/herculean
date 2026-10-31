using Herculean.Account.Infrastructure.Auth;

using Microsoft.AspNetCore.Identity;

namespace Herculean.Account.UnitTests.Infrastructure.Auth;

public sealed class PasswordHasherTests
{
    [Fact]
    public void HashVerifiesWithTheAspNetCoreHasher()
    {
        string hash = new PasswordHasher().Hash("password");

        hash.ShouldNotBe("password");
        new PasswordHasher<object>().VerifyHashedPassword(new object(), hash, "password").ShouldBe(PasswordVerificationResult.Success);
    }
}
