using Herculean.Account.Application.Email;
using Herculean.Account.Contracts;
using Herculean.SharedKernel.Events;

namespace Herculean.Account.Application.Users.AccountClosed;

/// <summary>Says why the account was closed and when it goes. A repeat after a retry does no harm.</summary>
internal sealed class AccountClosedIntegrationEventHandler(IEmailSender emailSender)
    : IIntegrationEventHandler<AccountClosedIntegrationEvent>
{
    public Task HandleAsync(AccountClosedIntegrationEvent @event, CancellationToken cancellationToken) =>
        emailSender.SendAccountClosedAsync(@event.Email, @event.DeleteAtUtc, @event.TimeZone, cancellationToken);
}
