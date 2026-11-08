using FluentValidation;
using FluentValidation.Results;

using Herculean.Account.Application.Auth;
using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.Users.DeleteCurrentUser;

internal sealed class DeleteCurrentUserHandler(
    IValidator<DeleteCurrentUserRequest> validator,
    CurrentUser currentUser,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IOutbox outbox,
    IPasswordHasher passwordHasher,
    TimeProvider timeProvider)
{
    public async Task<Result> HandleAsync(DeleteCurrentUserRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        User? user = await userRepository.GetByIdWithAllTokensAsync(currentUser.UserId, cancellationToken);
        if (user is null)
        {
            return UserErrors.NotFound;
        }

        if (passwordHasher.Verify(user.PasswordHash, request.CurrentPassword) == PasswordVerification.Failed)
        {
            return UserErrors.WrongCurrentPassword;
        }

        user.ScheduleDeletion(timeProvider.GetUtcNow());
        outbox.Add(new AccountDeletionScheduledIntegrationEvent(user.Email, user.DeletionScheduledForUtc!.Value, user.TimeZone));
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
