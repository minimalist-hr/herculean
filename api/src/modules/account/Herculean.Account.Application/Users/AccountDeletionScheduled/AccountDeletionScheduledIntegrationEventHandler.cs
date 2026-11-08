using Herculean.Account.Application.Email;
using Herculean.Account.Contracts;
using Herculean.SharedKernel.Events;

namespace Herculean.Account.Application.Users.AccountDeletionScheduled;

/// <summary>Says when the account goes and how to keep it. A repeat after a retry does no harm.</summary>
internal sealed class AccountDeletionScheduledIntegrationEventHandler(IEmailSender emailSender)
    : IIntegrationEventHandler<AccountDeletionScheduledIntegrationEvent>
{
    public Task HandleAsync(AccountDeletionScheduledIntegrationEvent @event, CancellationToken cancellationToken) =>
        emailSender.SendAccountDeletionScheduledAsync(@event.Email, @event.DeleteAtUtc, @event.TimeZone, cancellationToken);
}
