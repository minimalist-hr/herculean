using FluentValidation.Results;

using Herculean.Account.Application.Users.CreateUser;

namespace Herculean.Account.UnitTests.Application.Users.CreateUser;

public sealed class CreateUserValidatorTests
{
    private static readonly CreateUserRequest Valid = new("filip@example.com", "password", "Europe/Zagreb");

    private readonly CreateUserValidator _validator = new();

    [Fact]
    public void ValidRequestPasses()
    {
        _validator.Validate(Valid).IsValid.ShouldBeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("filip")]
    public void EmailMustBeAnEmail(string email)
    {
        ShouldFailOn(Valid with { Email = email }, nameof(CreateUserRequest.Email));
    }

    [Fact]
    public void EmailMustNotBeTooLong()
    {
        string email = new string('a', CreateUserValidator.EmailMaxLength - "@example.com".Length + 1) + "@example.com";

        ShouldFailOn(Valid with { Email = email }, nameof(CreateUserRequest.Email));
    }

    [Fact]
    public void PasswordMustHaveEightCharacters()
    {
        ShouldFailOn(Valid with { Password = "passwor" }, nameof(CreateUserRequest.Password));
    }

    [Theory]
    [InlineData("")]
    [InlineData("Mars/Olympus")]
    [InlineData("Central European Standard Time")]
    public void TimeZoneMustBeAnIanaName(string timeZone)
    {
        ShouldFailOn(Valid with { TimeZone = timeZone }, nameof(CreateUserRequest.TimeZone));
    }

    private void ShouldFailOn(CreateUserRequest request, string property)
    {
        ValidationResult result = _validator.Validate(request);

        result.Errors.ShouldContain(failure => failure.PropertyName == property);
    }
}
