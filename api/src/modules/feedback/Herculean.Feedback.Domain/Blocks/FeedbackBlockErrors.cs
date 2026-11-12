using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Domain.Blocks;

internal static class FeedbackBlockErrors
{
    // Must match the copy on F18 and F28.
    public static readonly Error Blocked = Error.Conflict("feedback.blocked", "You can’t send feedback right now.");
}
