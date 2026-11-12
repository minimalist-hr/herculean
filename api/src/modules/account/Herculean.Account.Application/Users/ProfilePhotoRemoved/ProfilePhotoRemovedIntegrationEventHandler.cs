using Herculean.Account.Application.Email;
using Herculean.Account.Contracts;
using Herculean.SharedKernel.Events;

namespace Herculean.Account.Application.Users.ProfilePhotoRemoved;

/// <summary>Says why the photo was removed. A repeat after a retry does no harm.</summary>
internal sealed class ProfilePhotoRemovedIntegrationEventHandler(IEmailSender emailSender)
    : IIntegrationEventHandler<ProfilePhotoRemovedIntegrationEvent>
{
    public Task HandleAsync(ProfilePhotoRemovedIntegrationEvent @event, CancellationToken cancellationToken) =>
        emailSender.SendProfilePhotoRemovedAsync(@event.Email, cancellationToken);
}
