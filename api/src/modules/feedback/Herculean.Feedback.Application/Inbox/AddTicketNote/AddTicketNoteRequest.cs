using System.ComponentModel;

namespace Herculean.Feedback.Application.Inbox.AddTicketNote;

[Description("A note on a ticket, which only admins see.")]
internal sealed record AddTicketNoteRequest(
    [property: Description("The note, 1 to 2,000 characters, trimmed.")] string Text);
