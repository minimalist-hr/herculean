using Herculean.Account.Application.Email;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Events;

namespace Herculean.Account.Application.EmailChanges.EmailChanged;

/// <summary>Tells the old address, so the owner notices if it wasn't them. A repeat after a retry does no harm.</summary>
internal sealed class EmailChangedIntegrationEventHandler(
    IUserRepository userRepository,
    IEmailSender emailSender) : IIntegrationEventHandler<EmailChangedIntegrationEvent>
{
    public async Task HandleAsync(EmailChangedIntegrationEvent @event, CancellationToken cancellationToken)
    {
        User? user = await userRepository.GetByIdAsync(UserId.From(@event.UserId), cancellationToken);
        if (user is null)
        {
            return;
        }

        await emailSender.SendEmailChangedAsync(@event.OldEmail, @event.ChangedAtUtc, user.TimeZone, cancellationToken);
    }
}
