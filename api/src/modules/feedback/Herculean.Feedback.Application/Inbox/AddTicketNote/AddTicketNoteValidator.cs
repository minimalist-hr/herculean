using FluentValidation;

using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Inbox.AddTicketNote;

internal sealed class AddTicketNoteValidator : AbstractValidator<AddTicketNoteRequest>
{
    public AddTicketNoteValidator()
    {
        RuleFor(request => request.Text)
            .Must(text => !string.IsNullOrWhiteSpace(text))
            .WithMessage("Write a note.")
            .Must(text => text is null || text.Trim().Length <= TicketNote.TextMaxLength)
            .WithMessage($"A note has at most {TicketNote.TextMaxLength:N0} characters.");
    }
}
