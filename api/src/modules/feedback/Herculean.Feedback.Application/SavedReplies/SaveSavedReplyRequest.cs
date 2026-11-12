using System.ComponentModel;

namespace Herculean.Feedback.Application.SavedReplies;

[Description("A saved reply's title and text.")]
internal sealed record SaveSavedReplyRequest(
    [property: Description("What it's called, 1 to 50 characters, trimmed, unique in any case.")] string Title,
    [property: Description("The reply, 1 to 2,000 characters, trimmed. {name} becomes the user's name when it's picked.")] string Text);
