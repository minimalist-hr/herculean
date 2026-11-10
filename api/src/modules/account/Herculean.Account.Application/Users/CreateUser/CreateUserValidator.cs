using FluentValidation;

namespace Herculean.Account.Application.Users.CreateUser;

internal sealed class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    // The longest address SMTP allows (RFC 5321).
    internal const int EmailMaxLength = 254;

    internal const int PasswordMinLength = 8;

    internal const int PasswordMaxLength = 128;

    public CreateUserValidator()
    {
        RuleFor(request => request.Email).NotEmpty().MaximumLength(EmailMaxLength).EmailAddress();
        RuleFor(request => request.Password).NotEmpty().MinimumLength(PasswordMinLength).MaximumLength(PasswordMaxLength);
        RuleFor(request => request.TimeZone).IanaTimeZone();
    }
}
