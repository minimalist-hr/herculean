namespace Herculean.Feedback.Application.Tickets.ListTickets;

internal sealed class ListTicketsHandler(ITicketReadRepository ticketReadRepository)
{
    public Task<List<TicketListItemResponse>> HandleAsync(CancellationToken cancellationToken) =>
        ticketReadRepository.ListAsync(cancellationToken);
}
