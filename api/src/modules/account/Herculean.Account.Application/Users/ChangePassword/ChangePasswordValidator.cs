using FluentValidation;

using Herculean.Account.Application.Users.CreateUser;

namespace Herculean.Account.Application.Users.ChangePassword;

internal sealed class ChangePasswordValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordValidator()
    {
        RuleFor(request => request.CurrentPassword).NotEmpty();
        RuleFor(request => request.NewPassword).NotEmpty().MinimumLength(CreateUserValidator.PasswordMinLength).MaximumLength(CreateUserValidator.PasswordMaxLength);
        RuleFor(request => request.RefreshToken).NotEmpty();
    }
}
