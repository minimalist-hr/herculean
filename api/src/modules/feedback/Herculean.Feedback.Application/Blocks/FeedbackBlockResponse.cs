using System.ComponentModel;

namespace Herculean.Feedback.Application.Blocks;

[Description("Whether a user can send feedback.")]
internal sealed record FeedbackBlockResponse(
    [property: Description("True when Minimalist blocked them from sending feedback or replying.")] bool Blocked);
