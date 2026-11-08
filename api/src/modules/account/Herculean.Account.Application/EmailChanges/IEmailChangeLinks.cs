namespace Herculean.Account.Application.EmailChanges;

internal interface IEmailChangeLinks
{
    /// <summary>The HTTPS page the email links to.</summary>
    string Page(string token);

    /// <summary>Opens the app's screen that confirms the new email.</summary>
    string Confirm(string token);
}
