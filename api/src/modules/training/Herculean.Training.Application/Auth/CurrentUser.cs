using Herculean.SharedKernel.Auth;
using Herculean.Training.Domain;

namespace Herculean.Training.Application.Auth;

internal sealed class CurrentUser(ICurrentUserAccessor currentUserAccessor)
{
    public UserId UserId => UserId.From(currentUserAccessor.UserId);
}
