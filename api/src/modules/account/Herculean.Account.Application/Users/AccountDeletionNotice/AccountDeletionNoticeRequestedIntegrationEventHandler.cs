using Herculean.Account.Application.Email;
using Herculean.Account.Contracts;
using Herculean.SharedKernel.Events;

namespace Herculean.Account.Application.Users.AccountDeletionNotice;

/// <summary>A last warning if it wasn't them. A repeat after a retry does no harm.</summary>
internal sealed class AccountDeletionNoticeRequestedIntegrationEventHandler(IEmailSender emailSender)
    : IIntegrationEventHandler<AccountDeletionNoticeRequestedIntegrationEvent>
{
    public Task HandleAsync(AccountDeletionNoticeRequestedIntegrationEvent @event, CancellationToken cancellationToken) =>
        emailSender.SendAccountDeletedAsync(@event.Email, @event.DeletedAtUtc, @event.TimeZone, cancellationToken);
}
