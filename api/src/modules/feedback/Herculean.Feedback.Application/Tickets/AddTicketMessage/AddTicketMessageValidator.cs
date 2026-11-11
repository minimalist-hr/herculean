using FluentValidation;

namespace Herculean.Feedback.Application.Tickets.AddTicketMessage;

internal sealed class AddTicketMessageValidator : AbstractValidator<AddTicketMessageRequest>
{
    public AddTicketMessageValidator()
    {
        this.AddMessageFieldRules();
    }
}
