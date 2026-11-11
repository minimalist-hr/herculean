using FluentValidation;

using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Inbox.ListInboxTickets;

internal sealed class ListInboxTicketsValidator : AbstractValidator<ListInboxTicketsRequest>
{
    public ListInboxTicketsValidator()
    {
        RuleFor(request => request.Status)
            .Must(status => status is null || Enum.TryParse<TicketStatus>(status, ignoreCase: true, out _))
            .WithMessage("Status must be open, answered or closed.");
    }
}
