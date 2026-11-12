using Herculean.Account.Contracts;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Queries;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Application.Inbox.GetInboxTicket;

internal sealed class GetInboxTicketHandler(
    IInboxReadRepository inboxReadRepository,
    IQueryHandler<GetUserContactsQuery, IReadOnlyList<UserContact>> contacts)
{
    public async Task<Result<InboxTicketResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        InboxTicketRow? row = await inboxReadRepository.GetAsync(TicketId.From(id), cancellationToken);
        if (row is null)
        {
            return TicketErrors.NotFound;
        }

        UserContact? sender = (await Senders.ReadAsync(contacts, [row.UserId], cancellationToken)).GetValueOrDefault(row.UserId);

        return new InboxTicketResponse(row.Id, row.Type, row.Status, row.UserId, sender?.Name, sender?.Email, row.AppVersion, row.Phone, row.Os, row.Priority, row.Messages, row.Notes);
    }
}
