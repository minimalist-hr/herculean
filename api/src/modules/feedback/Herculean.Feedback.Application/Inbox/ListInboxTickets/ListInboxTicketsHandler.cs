using FluentValidation;
using FluentValidation.Results;

using Herculean.Account.Contracts;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Queries;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Feedback.Application.Inbox.ListInboxTickets;

internal sealed class ListInboxTicketsHandler(
    IValidator<ListInboxTicketsRequest> validator,
    IInboxReadRepository inboxReadRepository,
    IQueryHandler<GetUserContactsQuery, IReadOnlyList<UserContact>> contacts)
{
    public async Task<Result<List<InboxTicketListItemResponse>>> HandleAsync(ListInboxTicketsRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        TicketStatus? status = request.Status is null ? null : Enum.Parse<TicketStatus>(request.Status, ignoreCase: true);
        List<InboxListRow> rows = await inboxReadRepository.ListAsync(status, cancellationToken);
        Dictionary<Guid, UserContact> senders = await Senders.ReadAsync(contacts, rows.Select(row => row.UserId), cancellationToken);

        return rows
            .Select(row =>
            {
                UserContact? sender = senders.GetValueOrDefault(row.UserId);
                return new InboxTicketListItemResponse(row.Id, row.Type, row.Status, row.Preview, row.LastMessageAtUtc, row.WaitingForReply, sender?.Name, sender?.Email);
            })
            .ToList();
    }
}
