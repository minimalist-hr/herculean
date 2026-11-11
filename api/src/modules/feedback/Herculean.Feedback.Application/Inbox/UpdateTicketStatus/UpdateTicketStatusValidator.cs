using FluentValidation;

using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Inbox.UpdateTicketStatus;

internal sealed class UpdateTicketStatusValidator : AbstractValidator<UpdateTicketStatusRequest>
{
    public UpdateTicketStatusValidator()
    {
        RuleFor(request => request.Status)
            .Must(status => status is TicketStatus.Open or TicketStatus.Closed)
            .WithMessage("Status must be open or closed.");
    }
}
