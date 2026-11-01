using FluentValidation;

using Herculean.Account.Application.Users.CreateUser;

namespace Herculean.Account.Application.PasswordResets.CompletePasswordReset;

internal sealed class CompletePasswordResetValidator : AbstractValidator<CompletePasswordResetRequest>
{
    public CompletePasswordResetValidator()
    {
        RuleFor(request => request.Token).NotEmpty();
        RuleFor(request => request.Password).NotEmpty().MinimumLength(CreateUserValidator.PasswordMinLength);
    }
}
