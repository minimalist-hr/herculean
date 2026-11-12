using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.Application.Users.RemoveUserPhoto;

internal sealed class RemoveUserPhotoHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IOutbox outbox)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        User? user = AdminUsers.OnlyUser(await userRepository.GetByIdWithPhotoAsync(new UserId(id), cancellationToken));
        if (user is null)
        {
            return UserErrors.NotFound;
        }

        // Already gone, so there is nothing to tell them.
        if (user.Photo is null)
        {
            return Result.Success();
        }

        user.RemovePhoto();
        outbox.Add(new ProfilePhotoRemovedIntegrationEvent(user.Email));
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
