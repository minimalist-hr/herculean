using System.ComponentModel;

using Microsoft.AspNetCore.Mvc;

namespace Herculean.Feedback.Application.Inbox.ListInboxTickets;

internal sealed record ListInboxTicketsRequest(
    [property: FromQuery(Name = "status"), Description("Only tickets that stand here: open, answered or closed. Left out, every ticket.")] string? Status,
    [property: FromQuery(Name = "userId"), Description("Only this user's tickets. Left out, everyone's.")] Guid? UserId = null);
