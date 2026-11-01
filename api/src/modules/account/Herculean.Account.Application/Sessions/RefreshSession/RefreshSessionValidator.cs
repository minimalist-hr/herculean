using FluentValidation;

namespace Herculean.Account.Application.Sessions.RefreshSession;

internal sealed class RefreshSessionValidator : AbstractValidator<RefreshSessionRequest>
{
    public RefreshSessionValidator()
    {
        RuleFor(request => request.RefreshToken).NotEmpty();
    }
}
