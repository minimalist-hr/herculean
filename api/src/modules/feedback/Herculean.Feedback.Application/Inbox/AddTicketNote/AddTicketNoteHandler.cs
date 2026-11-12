using FluentValidation;
using FluentValidation.Results;

using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Feedback.Application.Inbox.AddTicketNote;

internal sealed class AddTicketNoteHandler(
    IValidator<AddTicketNoteRequest> validator,
    ITicketRepository ticketRepository,
    ITicketNoteRepository noteRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, AddTicketNoteRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        Ticket? ticket = await ticketRepository.GetAnyAsync(TicketId.From(id), cancellationToken);
        if (ticket is null)
        {
            return TicketErrors.NotFound;
        }

        noteRepository.Add(TicketNote.Create(ticket, request.Text));
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
