using Herculean.Account.Application.PasswordResets.OpenResetLink;

namespace Herculean.Account.UnitTests.Application.PasswordResets.OpenResetLink;

public sealed class ResetLinkPageTests
{
    [Fact]
    public void LinkIsEncodedInTheRedirectAndTheButton()
    {
        string page = ResetLinkPage.Render("herculean://new-password?token=a&email=\"><script>");

        page.ShouldNotContain("<script>");
        page.ShouldContain("http-equiv=\"refresh\" content=\"0;url=herculean://new-password?token=a&amp;email=");
        page.ShouldContain("<a href=\"herculean://new-password?token=a&amp;email=");
    }
}
