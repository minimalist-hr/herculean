using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.Application.Users.DeleteExpiredData;

internal sealed class DeleteExpiredDataHandler(
    IUserRepository userRepository,
    IOutbox outbox,
    TimeProvider timeProvider)
{
    /// <summary>Deletes the tokens that can never be used again, and the events already sent, which can hold an email address.</summary>
    public async Task HandleAsync(CancellationToken cancellationToken)
    {
        await userRepository.DeleteExpiredTokensAsync(timeProvider.GetUtcNow(), cancellationToken);
        await outbox.DeleteSentAsync(cancellationToken);
    }
}
