using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Email;
using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Events;

namespace Herculean.Account.Application.EmailChanges.EmailChangeRequested;

/// <summary>Sends the link. The token is created here, so the plain token is never stored. A repeat sends a new link that replaces the last.</summary>
internal sealed class EmailChangeRequestedIntegrationEventHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IEmailChangeTokenIssuer emailChangeTokenIssuer,
    IEmailSender emailSender) : IIntegrationEventHandler<EmailChangeRequestedIntegrationEvent>
{
    public async Task HandleAsync(EmailChangeRequestedIntegrationEvent @event, CancellationToken cancellationToken)
    {
        User? user = await userRepository.GetByIdWithEmailChangeTokensAsync(UserId.From(@event.UserId), cancellationToken);
        if (user is null || user.Email == @event.NewEmail)
        {
            return;
        }

        string token = emailChangeTokenIssuer.Issue(user, @event.NewEmail);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await emailSender.SendEmailChangeAsync(@event.NewEmail, token, cancellationToken);
    }
}
