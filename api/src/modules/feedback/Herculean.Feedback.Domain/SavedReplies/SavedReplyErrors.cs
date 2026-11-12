using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Domain.SavedReplies;

internal static class SavedReplyErrors
{
    public static readonly Error NotFound = Error.NotFound("saved_reply.not_found", "The saved reply does not exist.");

    public static readonly Error LimitReached = Error.Conflict("saved_reply.limit_reached", $"There can be at most {SavedReply.MaxCount} saved replies.");

    public static readonly Error TitleTaken = Error.Validation(new Dictionary<string, string[]>
    {
        ["title"] = ["A saved reply already has this title."],
    });
}
