using FluentValidation;

using Herculean.Feedback.Application.Tickets;

namespace Herculean.Feedback.Application.Inbox.ReplyToTicket;

internal sealed class ReplyToTicketValidator : AbstractValidator<ReplyToTicketRequest>
{
    public ReplyToTicketValidator()
    {
        this.AddMessageFieldRules();
    }
}
