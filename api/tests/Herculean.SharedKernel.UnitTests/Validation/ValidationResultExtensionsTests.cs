using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.SharedKernel.UnitTests.Validation;

public sealed class ValidationResultExtensionsTests
{
    [Fact]
    public void FailuresBecomeFieldErrorsInCamelCase()
    {
        ValidationResult result = new(
        [
            new ValidationFailure("Email", "Enter an email."),
            new ValidationFailure("Email", "Email is too long."),
            new ValidationFailure("TimeZone", "Enter a time zone."),
        ]);

        Error error = result.ToError();

        error.Type.ShouldBe(ErrorType.Validation);
        error.Fields["email"].ShouldBe(["Enter an email.", "Email is too long."]);
        error.Fields["timeZone"].ShouldBe(["Enter a time zone."]);
    }
}
