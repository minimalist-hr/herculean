using System.ComponentModel;

namespace Herculean.Account.Application.EmailChanges.ConfirmEmailChange;

[Description("The token from the link in the email.")]
internal sealed record ConfirmEmailChangeRequest(
    [property: Description("The token from the link. It works once.")] string Token);
