using Herculean.Account.Application.Users.UpdateCurrentUser;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.UnitTests.Application.Users.UpdateCurrentUser;

public sealed class UpdateCurrentUserValidatorTests
{
    private static readonly UpdateCurrentUserRequest Nothing = new(Name: null, Units: null, TimeZone: null);

    private readonly UpdateCurrentUserValidator _validator = new();

    [Fact]
    public void RequestWithNothingToChangePasses()
    {
        _validator.Validate(Nothing).IsValid.ShouldBeTrue();
    }

    [Fact]
    public void RequestWithEveryFieldPasses()
    {
        _validator.Validate(new UpdateCurrentUserRequest(" Filip ", Units.Imperial, "Europe/London")).IsValid.ShouldBeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void NameMustNotBeBlank(string name)
    {
        ShouldFailOn(Nothing with { Name = name }, nameof(UpdateCurrentUserRequest.Name));
    }

    [Fact]
    public void NameMustNotBeTooLong()
    {
        ShouldFailOn(Nothing with { Name = new string('a', User.NameMaxLength + 1) }, nameof(UpdateCurrentUserRequest.Name));
    }

    [Fact]
    public void NameIsMeasuredTrimmed()
    {
        _validator.Validate(Nothing with { Name = $" {new string('a', User.NameMaxLength)} " }).IsValid.ShouldBeTrue();
    }

    [Fact]
    public void UnitsMustBeKnown()
    {
        ShouldFailOn(Nothing with { Units = (Units)7 }, nameof(UpdateCurrentUserRequest.Units));
    }

    [Fact]
    public void TimeZoneMustBeAnIanaName()
    {
        ShouldFailOn(Nothing with { TimeZone = "Mars/Olympus" }, nameof(UpdateCurrentUserRequest.TimeZone));
    }

    private void ShouldFailOn(UpdateCurrentUserRequest request, string property)
    {
        _validator.Validate(request).Errors.ShouldContain(failure => failure.PropertyName == property);
    }
}
