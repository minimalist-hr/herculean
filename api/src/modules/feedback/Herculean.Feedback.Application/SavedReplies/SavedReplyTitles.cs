using Herculean.Feedback.Domain.SavedReplies;

namespace Herculean.Feedback.Application.SavedReplies;

internal static class SavedReplyTitles
{
    /// <summary>Whether another saved reply has this title, in any case.</summary>
    public static bool IsTaken(IEnumerable<(SavedReplyId Id, string Title)> titles, string title, SavedReplyId? except = null) =>
        titles.Any(saved => saved.Id != except && string.Equals(saved.Title, title.Trim(), StringComparison.OrdinalIgnoreCase));
}
