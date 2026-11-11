using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Application.Tickets.MarkTicketRead;

internal sealed class MarkTicketReadHandler(ITicketRepository ticketRepository, IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        Ticket? ticket = await ticketRepository.GetAsync(TicketId.From(id), cancellationToken);
        if (ticket is null)
        {
            return TicketErrors.NotFound;
        }

        ticket.MarkRead();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
