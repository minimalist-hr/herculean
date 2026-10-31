using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Auth;

namespace Herculean.Account.Application.Auth;

internal sealed class CurrentUser(ICurrentUserAccessor currentUserAccessor)
{
    public UserId UserId => UserId.From(currentUserAccessor.UserId);
}
