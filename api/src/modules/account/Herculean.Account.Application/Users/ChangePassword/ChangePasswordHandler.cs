using FluentValidation;
using FluentValidation.Results;

using Herculean.Account.Application.Auth;
using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.Users.ChangePassword;

internal sealed class ChangePasswordHandler(
    IValidator<ChangePasswordRequest> validator,
    CurrentUser currentUser,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IOutbox outbox,
    IPasswordHasher passwordHasher,
    ITokenIssuer tokenIssuer,
    TimeProvider timeProvider)
{
    public async Task<Result> HandleAsync(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        User? user = await userRepository.GetByIdWithRefreshTokensAsync(currentUser.UserId, cancellationToken);
        if (user is null)
        {
            return UserErrors.NotFound;
        }

        if (passwordHasher.Verify(user.PasswordHash, request.CurrentPassword) == PasswordVerification.Failed)
        {
            return UserErrors.WrongCurrentPassword;
        }

        user.ChangePassword(passwordHasher.Hash(request.NewPassword), tokenIssuer.HashRefreshToken(request.RefreshToken));
        outbox.Add(new PasswordChangedIntegrationEvent(user.Id.Value, timeProvider.GetUtcNow()));
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
