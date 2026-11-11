using System.ComponentModel;

namespace Herculean.Feedback.Application.Tickets.GetUnreadFeedback;

[Description("How much of the user's feedback has a reply they haven't opened.")]
internal sealed record UnreadFeedbackResponse(
    [property: Description("How many tickets have a reply the user hasn't opened.")] int Count);
