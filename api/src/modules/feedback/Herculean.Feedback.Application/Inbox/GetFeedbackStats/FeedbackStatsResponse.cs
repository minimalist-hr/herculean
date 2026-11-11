using System.ComponentModel;

namespace Herculean.Feedback.Application.Inbox.GetFeedbackStats;

[Description("How much feedback needs the admin.")]
internal sealed record FeedbackStatsResponse(
    [property: Description("Tickets, not closed, whose latest message is the user's.")] int WaitingForReply);
