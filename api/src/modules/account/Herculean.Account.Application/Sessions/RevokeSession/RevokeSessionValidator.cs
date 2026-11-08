using FluentValidation;

namespace Herculean.Account.Application.Sessions.RevokeSession;

internal sealed class RevokeSessionValidator : AbstractValidator<RevokeSessionRequest>
{
    public RevokeSessionValidator()
    {
        RuleFor(request => request.RefreshToken).NotEmpty();
    }
}
