using Herculean.Account.Application.PasswordResets;

using Microsoft.Extensions.Options;

namespace Herculean.Account.Infrastructure.Email;

internal sealed class ResetLinks(IOptions<LinksOptions> options) : IResetLinks
{
    public string Page(string token) =>
        $"{options.Value.BaseUrl.TrimEnd('/')}{PasswordResetRoutes.ResetLink}?token={Uri.EscapeDataString(token)}";

    public string NewPassword(string token, string email) =>
        $"{options.Value.AppUrl}new-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}";

    public string Expired() => $"{options.Value.AppUrl}forgot-password?linkExpired=true";
}
