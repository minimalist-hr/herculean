using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.Application.Users.SignOutUser;

internal sealed class SignOutUserHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        User? user = AdminUsers.OnlyUser(await userRepository.GetByIdWithRefreshTokensAsync(new UserId(id), cancellationToken));
        if (user is null)
        {
            return UserErrors.NotFound;
        }

        user.SignOutEverywhere();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
