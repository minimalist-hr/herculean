using Herculean.Account.Application.Email;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Events;

namespace Herculean.Account.Application.Users.AccountKept;

/// <summary>Tells the user their account stays and they can sign in. A repeat after a retry does no harm.</summary>
internal sealed class AccountKeptIntegrationEventHandler(
    IUserRepository userRepository,
    IEmailSender emailSender) : IIntegrationEventHandler<AccountKeptIntegrationEvent>
{
    public async Task HandleAsync(AccountKeptIntegrationEvent @event, CancellationToken cancellationToken)
    {
        User? user = await userRepository.GetByIdAsync(UserId.From(@event.UserId), cancellationToken);
        if (user is null)
        {
            return;
        }

        await emailSender.SendAccountKeptAsync(user.Email, cancellationToken);
    }
}
