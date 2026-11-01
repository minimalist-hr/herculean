using Herculean.Account.Infrastructure.Email;

using Microsoft.Extensions.Options;

namespace Herculean.Account.UnitTests.Infrastructure.Email;

public sealed class ResetLinksTests
{
    private readonly ResetLinks _resetLinks = new(Options.Create(new LinksOptions
    {
        BaseUrl = "https://api.example.com/",
        AppUrl = "exp://192.168.1.2:8081/--/",
    }));

    [Fact]
    public void PageIsOnTheApiWithTheTokenEscaped() =>
        _resetLinks.Page("a+b").ShouldBe("https://api.example.com/links/reset-password?token=a%2Bb");

    [Fact]
    public void NewPasswordCarriesTheTokenAndTheEmailEscaped() =>
        _resetLinks.NewPassword("a+b", "filip+1@example.com").ShouldBe("exp://192.168.1.2:8081/--/new-password?token=a%2Bb&email=filip%2B1%40example.com");

    [Fact]
    public void ExpiredOpensTheResetPasswordScreen() =>
        _resetLinks.Expired().ShouldBe("exp://192.168.1.2:8081/--/forgot-password?linkExpired=true");
}
