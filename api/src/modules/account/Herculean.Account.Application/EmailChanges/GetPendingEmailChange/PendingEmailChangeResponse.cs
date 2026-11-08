using System.ComponentModel;

namespace Herculean.Account.Application.EmailChanges.GetPendingEmailChange;

[Description("The email change waiting for its link to be opened.")]
internal sealed record PendingEmailChangeResponse(
    [property: Description("The address waiting to be confirmed, or null when none is.")] string? NewEmail);
