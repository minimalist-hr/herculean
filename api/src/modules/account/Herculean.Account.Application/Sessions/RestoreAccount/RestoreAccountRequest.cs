using System.ComponentModel;

namespace Herculean.Account.Application.Sessions.RestoreAccount;

[Description("The sign in details of an account waiting to be deleted.")]
internal sealed record RestoreAccountRequest(
    [property: Description("The account's email, in any case.")] string Email,
    [property: Description("The account's password.")] string Password);
