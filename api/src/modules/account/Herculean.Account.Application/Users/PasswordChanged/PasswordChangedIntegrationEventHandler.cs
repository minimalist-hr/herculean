using Herculean.Account.Application.Email;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Events;

namespace Herculean.Account.Application.Users.PasswordChanged;

/// <summary>Tells the user by email, so they notice if it wasn't them. A repeat after a retry does no harm.</summary>
internal sealed class PasswordChangedIntegrationEventHandler(
    IUserRepository userRepository,
    IEmailSender emailSender) : IIntegrationEventHandler<PasswordChangedIntegrationEvent>
{
    public async Task HandleAsync(PasswordChangedIntegrationEvent @event, CancellationToken cancellationToken)
    {
        User? user = await userRepository.GetByIdAsync(UserId.From(@event.UserId), cancellationToken);
        if (user is null)
        {
            return;
        }

        await emailSender.SendPasswordChangedAsync(user.Email, @event.ChangedAtUtc, user.TimeZone, @event.WithResetLink, cancellationToken);
    }
}
