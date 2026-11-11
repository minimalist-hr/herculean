using FluentValidation;
using FluentValidation.Results;

using Herculean.Feedback.Application.Tickets;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Feedback.Application.Inbox.ReplyToTicket;

internal sealed class ReplyToTicketHandler(
    IValidator<ReplyToTicketRequest> validator,
    ITicketRepository ticketRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, ReplyToTicketRequest request, CancellationToken cancellationToken)
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

        if (ticket.IsClosed)
        {
            return TicketErrors.Closed;
        }

        ticket.ReplyAsAdmin(request.Message, request.ToImages());
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
