using Herculean.Account.Application.EmailChanges;

using Microsoft.Extensions.Options;

namespace Herculean.Account.Infrastructure.Email;

internal sealed class EmailChangeLinks(IOptions<LinksOptions> options) : IEmailChangeLinks
{
    public string Page(string token) =>
        $"{options.Value.BaseUrl.TrimEnd('/')}{EmailChangeRoutes.ConfirmLink}?token={Uri.EscapeDataString(token)}";

    public string Confirm(string token) =>
        $"{options.Value.AppUrl}confirm-email?token={Uri.EscapeDataString(token)}";
}
