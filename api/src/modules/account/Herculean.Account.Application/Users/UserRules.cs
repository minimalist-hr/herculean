using FluentValidation;

using Herculean.Account.Domain.Users;

namespace Herculean.Account.Application.Users;

/// <summary>Field rules that more than one user request shares.</summary>
internal static class UserRules
{
    public static IRuleBuilderOptions<T, string> IanaTimeZone<T>(this IRuleBuilder<T, string> ruleBuilder) =>
        ruleBuilder.Must(BeIanaTimeZone).WithMessage("'{PropertyName}' must be an IANA time zone, for example Europe/Zagreb.");

    public static IRuleBuilderOptions<T, string> UserName<T>(this IRuleBuilder<T, string> ruleBuilder) =>
        ruleBuilder.Must(name => !string.IsNullOrWhiteSpace(name) && name.Trim().Length <= User.NameMaxLength)
            .WithMessage($"'{{PropertyName}}' must have 1 to {User.NameMaxLength} characters.");

    // Windows also knows its own time zone names. Only IANA names are allowed.
    private static bool BeIanaTimeZone(string timeZone) =>
        TimeZoneInfo.TryFindSystemTimeZoneById(timeZone, out TimeZoneInfo? zone) && zone.HasIanaId;
}
