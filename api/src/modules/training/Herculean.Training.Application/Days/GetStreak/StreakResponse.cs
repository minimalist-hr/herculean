using System.ComponentModel;

namespace Herculean.Training.Application.Days.GetStreak;

[Description("How long the user has kept to their plan.")]
internal sealed record StreakResponse(
    [property: Description("Finished weeks in a row with no planned day missed. A skipped day doesn't break it, and this week doesn't count until it's over.")] int Weeks,
    [property: Description("The longest streak so far, in weeks.")] int Best);
