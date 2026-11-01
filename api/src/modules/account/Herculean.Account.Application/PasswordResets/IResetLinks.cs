namespace Herculean.Account.Application.PasswordResets;

internal interface IResetLinks
{
    /// <summary>The HTTPS page the email links to.</summary>
    string Page(string token);

    /// <summary>Opens the app's new password screen.</summary>
    string NewPassword(string token, string email);

    /// <summary>Opens the app's reset password screen, which says the link has expired.</summary>
    string Expired();
}
