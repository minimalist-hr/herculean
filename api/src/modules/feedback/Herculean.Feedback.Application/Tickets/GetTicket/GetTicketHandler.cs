using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Application.Tickets.GetTicket;

internal sealed class GetTicketHandler(ITicketReadRepository ticketReadRepository)
{
    public async Task<Result<TicketResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        TicketResponse? ticket = await ticketReadRepository.GetAsync(TicketId.From(id), cancellationToken);

        return ticket is null ? TicketErrors.NotFound : ticket;
    }
}
