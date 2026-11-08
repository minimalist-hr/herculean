using FluentValidation;
using FluentValidation.Results;

using Herculean.Account.Application.Auth;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.Users.SaveCurrentUserPhoto;

internal sealed class SaveCurrentUserPhotoHandler(
    IValidator<SaveCurrentUserPhotoRequest> validator,
    CurrentUser currentUser,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(SaveCurrentUserPhotoRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        User? user = await userRepository.GetByIdWithPhotoAsync(currentUser.UserId, cancellationToken);
        if (user is null)
        {
            return UserErrors.NotFound;
        }

        user.SetPhoto(Convert.FromBase64String(request.Image));
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
