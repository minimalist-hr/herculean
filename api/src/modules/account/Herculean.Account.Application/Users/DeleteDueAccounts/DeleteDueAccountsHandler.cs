using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.Application.Users.DeleteDueAccounts;

internal sealed class DeleteDueAccountsHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IOutbox outbox,
    TimeProvider timeProvider)
{
    /// <summary>Deletes every account whose wait is over, and tells Training, Feedback and the user.</summary>
    public async Task HandleAsync(CancellationToken cancellationToken)
    {
        DateTimeOffset nowUtc = timeProvider.GetUtcNow();
        IReadOnlyList<User> dueUsers = await userRepository.ListDueForDeletionAsync(nowUtc, cancellationToken);

        foreach (User user in dueUsers)
        {
            userRepository.Remove(user);
            outbox.Add(new AccountDeletedIntegrationEvent(user.Id.Value));
            outbox.Add(new AccountDeletionNoticeRequestedIntegrationEvent(user.Email, nowUtc, user.TimeZone));
        }

        if (dueUsers.Count > 0)
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
