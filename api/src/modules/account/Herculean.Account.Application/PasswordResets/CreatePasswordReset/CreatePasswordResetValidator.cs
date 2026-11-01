using FluentValidation;

using Herculean.Account.Application.Users.CreateUser;

namespace Herculean.Account.Application.PasswordResets.CreatePasswordReset;

internal sealed class CreatePasswordResetValidator : AbstractValidator<CreatePasswordResetRequest>
{
    public CreatePasswordResetValidator()
    {
        RuleFor(request => request.Email).NotEmpty().MaximumLength(CreateUserValidator.EmailMaxLength).EmailAddress();
    }
}
