using FluentValidation;

namespace Herculean.SharedKernel.Validation;

/// <summary>The rule for an image sent as a Base64 JPEG, such as a profile photo or a screenshot.</summary>
public static class JpegRules
{
    /// <summary>The most an image may hold: 1 MB.</summary>
    public const int MaxBytes = 1024 * 1024;

    /// <summary>Checks that the text is a Base64 JPEG of at most <see cref="MaxBytes"/>.</summary>
    /// <typeparam name="T">The request.</typeparam>
    /// <param name="rule">The rule for the image's field.</param>
    public static IRuleBuilderOptions<T, string> MustBeJpeg<T>(this IRuleBuilder<T, string> rule) =>
        rule.Must(IsJpegWithinLimit);

    private static bool IsJpegWithinLimit(string? image)
    {
        if (image is null)
        {
            return false;
        }

        byte[] bytes = new byte[MaxBytes];

        // Fails when it isn't Base64, and when it doesn't fit.
        return Convert.TryFromBase64String(image, bytes, out int written)
            && written >= 3
            && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF;
    }
}
