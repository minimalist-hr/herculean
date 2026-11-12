using System.ComponentModel;

namespace Herculean.Feedback.Application.SavedReplies.CreateSavedReply;

[Description("The new saved reply.")]
internal sealed record SavedReplyCreatedResponse(
    [property: Description("Its ID.")] Guid Id);
