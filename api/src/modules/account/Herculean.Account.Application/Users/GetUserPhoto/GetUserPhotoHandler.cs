using Herculean.Account.Application.Users.GetCurrentUserPhoto;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.Application.Users.GetUserPhoto;

internal sealed class GetUserPhotoHandler(IUserRepository userRepository)
{
    public async Task<Result<UserPhotoResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        User? user = AdminUsers.OnlyUser(await userRepository.GetByIdWithPhotoAsync(new UserId(id), cancellationToken));

        return user is null
            ? UserErrors.NotFound
            : new UserPhotoResponse(user.Photo is null ? null : Convert.ToBase64String(user.Photo.Image));
    }
}
