using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.Application.Users.CancelUserDeletion;

internal sealed class CancelUserDeletionHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        User? user = AdminUsers.OnlyUser(await userRepository.GetByIdAsync(new UserId(id), cancellationToken));
        if (user is null)
        {
            return UserErrors.NotFound;
        }

        user.CancelDeletion();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
