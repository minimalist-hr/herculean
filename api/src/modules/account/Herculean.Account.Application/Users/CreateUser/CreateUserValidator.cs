using FluentValidation;

namespace Herculean.Account.Application.Users.CreateUser;

internal sealed class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    // The longest address SMTP allows (RFC 5321).
    internal const int EmailMaxLength = 254;

    internal const int PasswordMinLength = 8;

    public CreateUserValidator()
    {
        RuleFor(request => request.Email).NotEmpty().MaximumLength(EmailMaxLength).EmailAddress();
        RuleFor(request => request.Password).NotEmpty().MinimumLength(PasswordMinLength);
        RuleFor(request => request.TimeZone).IanaTimeZone();
    }
}
