using FluentValidation;
using FluentValidation.Results;

using Herculean.Account.Application.Auth;
using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.PasswordResets.CompletePasswordReset;

internal sealed class CompletePasswordResetHandler(
    IValidator<CompletePasswordResetRequest> validator,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IOutbox outbox,
    IPasswordResetTokenIssuer passwordResetTokenIssuer,
    IPasswordHasher passwordHasher,
    TimeProvider timeProvider)
{
    public async Task<Result> HandleAsync(CompletePasswordResetRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        string tokenHash = passwordResetTokenIssuer.Hash(request.Token);
        User? user = await userRepository.GetByPasswordResetTokenHashAsync(tokenHash, cancellationToken);
        PasswordResetToken? passwordResetToken = user?.PasswordResetTokens.SingleOrDefault(token => token.TokenHash == tokenHash);
        if (user is null || passwordResetToken is null)
        {
            return UserErrors.InvalidPasswordResetToken;
        }

        DateTimeOffset nowUtc = timeProvider.GetUtcNow();
        if (passwordResetToken.IsExpired(nowUtc))
        {
            user.RemovePasswordResetToken(passwordResetToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return UserErrors.InvalidPasswordResetToken;
        }

        user.ResetPassword(passwordHasher.Hash(request.Password));
        outbox.Add(new PasswordChangedIntegrationEvent(user.Id.Value, nowUtc, WithResetLink: true));
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
