using FluentValidation;
using FluentValidation.Results;

using Herculean.Account.Application.Auth;
using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.EmailChanges.RequestEmailChange;

internal sealed class RequestEmailChangeHandler(
    IValidator<RequestEmailChangeRequest> validator,
    CurrentUser currentUser,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IOutbox outbox,
    IPasswordHasher passwordHasher)
{
    public async Task<Result> HandleAsync(RequestEmailChangeRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        User? user = await userRepository.GetByIdAsync(currentUser.UserId, cancellationToken);
        if (user is null)
        {
            return UserErrors.NotFound;
        }

        // The password comes first, so only the owner learns whether an address is taken.
        if (passwordHasher.Verify(user.PasswordHash, request.CurrentPassword) == PasswordVerification.Failed)
        {
            return UserErrors.WrongCurrentPassword;
        }

        string newEmail = User.NormalizeEmail(request.NewEmail);
        if (newEmail == user.Email)
        {
            return UserErrors.SameEmail;
        }

        if (await userRepository.EmailExistsAsync(newEmail, cancellationToken))
        {
            return UserErrors.EmailTaken;
        }

        outbox.Add(new EmailChangeRequestedIntegrationEvent(user.Id.Value, newEmail));
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
