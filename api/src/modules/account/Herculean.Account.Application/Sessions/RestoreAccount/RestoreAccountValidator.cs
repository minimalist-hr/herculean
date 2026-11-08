using FluentValidation;

namespace Herculean.Account.Application.Sessions.RestoreAccount;

internal sealed class RestoreAccountValidator : AbstractValidator<RestoreAccountRequest>
{
    public RestoreAccountValidator()
    {
        RuleFor(request => request.Email).NotEmpty();
        RuleFor(request => request.Password).NotEmpty();
    }
}
