using FluentValidation;
using FluentValidation.Results;

using Herculean.Account.Application.Auth;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.Users.UpdateCurrentUser;

internal sealed class UpdateCurrentUserHandler(
    IValidator<UpdateCurrentUserRequest> validator,
    CurrentUser currentUser,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<UserResponse>> HandleAsync(UpdateCurrentUserRequest request, CancellationToken cancellationToken)
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

        if (request.Name is not null)
        {
            user.ChangeName(request.Name);
        }

        if (request.Units is Units units)
        {
            user.ChangeUnits(units);
        }

        if (request.TimeZone is not null)
        {
            user.ChangeTimeZone(request.TimeZone);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return UserResponse.From(user);
    }
}
