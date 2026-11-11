using FluentValidation;
using FluentValidation.Results;

using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Feedback.Application.Tickets.AddTicketMessage;

internal sealed class AddTicketMessageHandler(
    IValidator<AddTicketMessageRequest> validator,
    ITicketRepository ticketRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, AddTicketMessageRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        Ticket? ticket = await ticketRepository.GetAsync(TicketId.From(id), cancellationToken);
        if (ticket is null)
        {
            return TicketErrors.NotFound;
        }

        if (ticket.IsClosed)
        {
            return TicketErrors.Closed;
        }

        ticket.ReplyAsUser(request.Message, request.ToImages());
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
