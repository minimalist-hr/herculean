using Herculean.Account.Application.Auth;
using Herculean.Account.Infrastructure.Auth;

using Microsoft.AspNetCore.Identity;

namespace Herculean.Account.UnitTests.Infrastructure.Auth;

public sealed class PasswordHasherTests
{
    private readonly PasswordHasher _passwordHasher = new();

    [Fact]
    public void HashVerifiesWithTheAspNetCoreHasher()
    {
        string hash = _passwordHasher.Hash("password");

        hash.ShouldNotBe("password");
        new PasswordHasher<object>().VerifyHashedPassword(new object(), hash, "password").ShouldBe(PasswordVerificationResult.Success);
    }

    [Fact]
    public void RightPasswordPasses()
    {
        _passwordHasher.Verify(_passwordHasher.Hash("password"), "password").ShouldBe(PasswordVerification.Success);
    }

    [Fact]
    public void WrongPasswordFails()
    {
        _passwordHasher.Verify(_passwordHasher.Hash("password"), "wrong").ShouldBe(PasswordVerification.Failed);
    }

    [Fact]
    public void NoAccountFailsEvenWithTheDummyPassword()
    {
        _passwordHasher.Verify(passwordHash: null, "no account").ShouldBe(PasswordVerification.Failed);
    }
}
