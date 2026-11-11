using FluentValidation;

using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Tickets.CreateTicket;

internal sealed class CreateTicketValidator : AbstractValidator<CreateTicketRequest>
{
    public CreateTicketValidator()
    {
        RuleFor(request => request.Type).IsInEnum();
        this.AddMessageFieldRules();
        RuleFor(request => request.AppVersion).NotEmpty().MaximumLength(Ticket.AppVersionMaxLength);
        RuleFor(request => request.Phone).MaximumLength(Ticket.PhoneMaxLength);
        RuleFor(request => request.Os).NotEmpty().MaximumLength(Ticket.OsMaxLength);
    }
}
