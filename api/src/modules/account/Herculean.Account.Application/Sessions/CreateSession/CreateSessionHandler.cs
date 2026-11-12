using FluentValidation;
using FluentValidation.Results;

using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Email;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.Sessions.CreateSession;

internal sealed class CreateSessionHandler(
    IValidator<CreateSessionRequest> validator,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    ITokenIssuer tokenIssuer)
{
    public async Task<Result<TokenResponse>> HandleAsync(CreateSessionRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        User? user = await userRepository.GetByEmailAsync(request.Email, cancellationToken);

        // Checked even when there is no such account, so both cases take as long.
        PasswordVerification passwordVerification = passwordHasher.Verify(user?.PasswordHash, request.Password);
        if (user is null || passwordVerification == PasswordVerification.Failed)
        {
            return UserErrors.InvalidCredentials;
        }

        // After the password check, so only the owner learns the account was closed or is waiting to be deleted.
        if (user.IsClosed)
        {
            return UserErrors.AccountClosed;
        }

        if (user.DeletionScheduledForUtc is DateTimeOffset deleteAtUtc)
        {
            return UserErrors.DeletionScheduled(LocalDates.FormatDate(deleteAtUtc, user.TimeZone));
        }

        if (passwordVerification == PasswordVerification.SuccessRehashNeeded)
        {
            user.ChangePasswordHash(passwordHasher.Hash(request.Password));
        }

        TokenResponse tokenResponse = tokenIssuer.Issue(user);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return tokenResponse;
    }
}
