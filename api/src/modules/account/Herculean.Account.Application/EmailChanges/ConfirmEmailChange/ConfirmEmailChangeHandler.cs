using FluentValidation;
using FluentValidation.Results;

using Herculean.Account.Application.Auth;
using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.EmailChanges.ConfirmEmailChange;

internal sealed class ConfirmEmailChangeHandler(
    IValidator<ConfirmEmailChangeRequest> validator,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IOutbox outbox,
    IEmailChangeTokenIssuer emailChangeTokenIssuer,
    TimeProvider timeProvider)
{
    public async Task<Result> HandleAsync(ConfirmEmailChangeRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        string tokenHash = emailChangeTokenIssuer.Hash(request.Token);
        User? user = await userRepository.GetByEmailChangeTokenHashAsync(tokenHash, cancellationToken);
        EmailChangeToken? emailChangeToken = user?.EmailChangeTokens.SingleOrDefault(token => token.TokenHash == tokenHash);
        if (user is null || emailChangeToken is null)
        {
            return UserErrors.InvalidEmailChangeToken;
        }

        DateTimeOffset nowUtc = timeProvider.GetUtcNow();
        if (emailChangeToken.IsExpired(nowUtc))
        {
            user.RemoveEmailChangeToken(emailChangeToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return UserErrors.InvalidEmailChangeToken;
        }

        // Someone may have taken the address since the link was sent.
        if (await userRepository.EmailExistsAsync(emailChangeToken.NewEmail, cancellationToken))
        {
            user.RemoveEmailChangeToken(emailChangeToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return UserErrors.EmailTaken;
        }

        string oldEmail = user.Email;
        user.ChangeEmail(emailChangeToken.NewEmail);
        outbox.Add(new EmailChangedIntegrationEvent(user.Id.Value, oldEmail, nowUtc));
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
