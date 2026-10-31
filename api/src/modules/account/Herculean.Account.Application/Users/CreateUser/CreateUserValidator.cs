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
        RuleFor(request => request.TimeZone).Must(BeIanaTimeZone).WithMessage("'Time Zone' must be an IANA time zone, for example Europe/Zagreb.");
    }

    // Windows also knows its own time zone names. Only IANA names are allowed.
    private static bool BeIanaTimeZone(string timeZone) =>
        TimeZoneInfo.TryFindSystemTimeZoneById(timeZone, out TimeZoneInfo? zone) && zone.HasIanaId;
}
