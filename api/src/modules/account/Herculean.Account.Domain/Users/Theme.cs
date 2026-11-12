using System.ComponentModel;

namespace Herculean.Account.Domain.Users;

[Description("The app's look: colors, corners and borders. Default, Mono, Emerald and Smoke are dark; Paper, Fjord, Latte and Frost are light.")]
internal enum Theme
{
    Default,
    Mono,
    Emerald,
    Smoke,
    Paper,
    Fjord,
    Latte,
    Frost,
}
