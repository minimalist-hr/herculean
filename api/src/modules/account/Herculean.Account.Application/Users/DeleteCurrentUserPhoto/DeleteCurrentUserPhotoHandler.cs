using Herculean.Account.Application.Auth;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.Application.Users.DeleteCurrentUserPhoto;

internal sealed class DeleteCurrentUserPhotoHandler(
    CurrentUser currentUser,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(CancellationToken cancellationToken)
    {
        User? user = await userRepository.GetByIdWithPhotoAsync(currentUser.UserId, cancellationToken);
        if (user is null)
        {
            return UserErrors.NotFound;
        }

        user.RemovePhoto();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
