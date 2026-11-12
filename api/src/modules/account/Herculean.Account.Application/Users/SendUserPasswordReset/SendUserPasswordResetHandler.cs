using Herculean.Account.Application.PasswordResets;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.Application.Users.SendUserPasswordReset;

internal sealed class SendUserPasswordResetHandler(
    IUserRepository userRepository,
    IPasswordResetQueue passwordResetQueue)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        User? user = AdminUsers.OnlyUser(await userRepository.GetByIdAsync(new UserId(id), cancellationToken));
        if (user is null)
        {
            return UserErrors.NotFound;
        }

        passwordResetQueue.Enqueue(user.Email);

        return Result.Success();
    }
}
