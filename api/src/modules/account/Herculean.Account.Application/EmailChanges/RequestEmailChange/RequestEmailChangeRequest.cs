using System.ComponentModel;

namespace Herculean.Account.Application.EmailChanges.RequestEmailChange;

[Description("The new email, and the password that proves it's the user asking.")]
internal sealed record RequestEmailChangeRequest(
    [property: Description("The new address. The link goes there.")] string NewEmail,
    [property: Description("The password the user has now.")] string CurrentPassword);
