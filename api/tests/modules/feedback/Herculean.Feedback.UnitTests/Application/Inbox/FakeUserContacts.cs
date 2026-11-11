using Herculean.Account.Contracts;
using Herculean.SharedKernel.Queries;

namespace Herculean.Feedback.UnitTests.Application.Inbox;

/// <summary>Answers with the contacts it was given, and leaves out any other user.</summary>
internal sealed class FakeUserContacts(params UserContact[] contacts) : IQueryHandler<GetUserContactsQuery, IReadOnlyList<UserContact>>
{
    public Task<IReadOnlyList<UserContact>> HandleAsync(GetUserContactsQuery query, CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<UserContact>>([.. contacts.Where(contact => query.UserIds.Contains(contact.UserId))]);
}
