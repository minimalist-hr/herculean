using Herculean.Account.Contracts;
using Herculean.SharedKernel.Queries;

namespace Herculean.Feedback.Application.Inbox;

/// <summary>Names the users who sent tickets. Feedback keeps no names or emails of its own.</summary>
internal static class Senders
{
    public static async Task<Dictionary<Guid, UserContact>> ReadAsync(
        IQueryHandler<GetUserContactsQuery, IReadOnlyList<UserContact>> contacts,
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<UserContact> found = await contacts.HandleAsync(new GetUserContactsQuery([.. userIds.Distinct()]), cancellationToken);

        return found.ToDictionary(contact => contact.UserId);
    }
}
