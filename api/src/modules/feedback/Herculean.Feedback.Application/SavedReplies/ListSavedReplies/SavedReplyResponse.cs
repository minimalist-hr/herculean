using System.ComponentModel;

namespace Herculean.Feedback.Application.SavedReplies.ListSavedReplies;

[Description("An answer Minimalist sends often.")]
internal sealed record SavedReplyResponse(
    [property: Description("The saved reply's ID.")] Guid Id,
    [property: Description("What it's called.")] string Title,
    [property: Description("The reply. {name} stands for the user's name.")] string Text);
