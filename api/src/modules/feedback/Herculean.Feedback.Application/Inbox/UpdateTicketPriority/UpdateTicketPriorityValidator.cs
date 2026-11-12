using FluentValidation;

namespace Herculean.Feedback.Application.Inbox.UpdateTicketPriority;

internal sealed class UpdateTicketPriorityValidator : AbstractValidator<UpdateTicketPriorityRequest>
{
    public UpdateTicketPriorityValidator()
    {
        RuleFor(request => request.Priority)
            .IsInEnum()
            .WithMessage("Priority must be normal or high.");
    }
}
