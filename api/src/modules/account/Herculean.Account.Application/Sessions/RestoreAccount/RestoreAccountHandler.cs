using FluentValidation;
using FluentValidation.Results;

using Herculean.Account.Application.Auth;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.Sessions.RestoreAccount;

internal sealed class RestoreAccountHandler(
    IValidator<RestoreAccountRequest> validator,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    ITokenIssuer tokenIssuer)
{
    public async Task<Result<TokenResponse>> HandleAsync(RestoreAccountRequest request, CancellationToken cancellationToken)
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

        if (user.IsClosed)
        {
            return UserErrors.AccountClosed;
        }

        user.CancelDeletion();
        TokenResponse tokenResponse = tokenIssuer.Issue(user);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return tokenResponse;
    }
}
