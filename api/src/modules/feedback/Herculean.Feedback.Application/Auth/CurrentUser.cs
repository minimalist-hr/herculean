using Herculean.Feedback.Domain;
using Herculean.SharedKernel.Auth;

namespace Herculean.Feedback.Application.Auth;

internal sealed class CurrentUser(ICurrentUserAccessor currentUserAccessor)
{
    public UserId UserId => UserId.From(currentUserAccessor.UserId);
}
