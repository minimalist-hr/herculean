using Herculean.Account.Application.Auth;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.Application.Users.GetCurrentUserPhoto;

internal sealed class GetCurrentUserPhotoHandler(CurrentUser currentUser, IUserRepository userRepository)
{
    public async Task<Result<UserPhotoResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        User? user = await userRepository.GetByIdWithPhotoAsync(currentUser.UserId, cancellationToken);
        if (user is null)
        {
            return UserErrors.NotFound;
        }

        return new UserPhotoResponse(user.Photo is null ? null : Convert.ToBase64String(user.Photo.Image));
    }
}
