using System.ComponentModel;

namespace Herculean.Account.Domain.Users;

[Description("Light or dark: matchPhone follows the phone's setting.")]
internal enum Theme
{
    MatchPhone,
    Dark,
    Light,
}
