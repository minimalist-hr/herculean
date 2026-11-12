using FluentValidation;
using FluentValidation.Results;

using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Feedback.Application.Inbox.UpdateTicketPriority;

internal sealed class UpdateTicketPriorityHandler(
    IValidator<UpdateTicketPriorityRequest> validator,
    ITicketRepository ticketRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, UpdateTicketPriorityRequest request, CancellationToken cancellationToken)
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

        ticket.ChangePriority(request.Priority);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
