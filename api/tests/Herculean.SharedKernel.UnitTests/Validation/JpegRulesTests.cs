using FluentValidation;

using Herculean.SharedKernel.Validation;

namespace Herculean.SharedKernel.UnitTests.Validation;

public sealed class JpegRulesTests
{
    private static readonly ImageValidator Validator = new();

    [Fact]
    public void ABase64JpegPasses()
    {
        Validator.Validate(new Image(Convert.ToBase64String([0xFF, 0xD8, 0xFF, 0xE0]))).IsValid.ShouldBeTrue();
    }

    [Fact]
    public void AJpegOf1MbPassesAndOneByteMoreFails()
    {
        byte[] largest = new byte[JpegRules.MaxBytes];
        largest[0] = 0xFF;
        largest[1] = 0xD8;
        largest[2] = 0xFF;
        byte[] tooLarge = [.. largest, 0];

        Validator.Validate(new Image(Convert.ToBase64String(largest))).IsValid.ShouldBeTrue();
        Validator.Validate(new Image(Convert.ToBase64String(tooLarge))).IsValid.ShouldBeFalse();
    }

    [Theory]
    [InlineData("not base64!")]
    [InlineData("")]
    [InlineData("iVBORw==")]
    public void AnythingElseFails(string image)
    {
        Validator.Validate(new Image(image)).IsValid.ShouldBeFalse();
    }

    private sealed record Image(string Value);

    private sealed class ImageValidator : AbstractValidator<Image>
    {
        public ImageValidator()
        {
            RuleFor(image => image.Value).MustBeJpeg();
        }
    }
}
