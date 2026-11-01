using System.ComponentModel;

namespace Herculean.Account.Application.Sessions.CreateSession;

[Description("Email and password to sign in with.")]
internal sealed record CreateSessionRequest(
    [property: Description("The account's email, in any case.")] string Email,
    [property: Description("The account's password.")] string Password);
