using FluentValidation;

namespace Herculean.Account.Application.Users.SaveCurrentUserPhoto;

internal sealed class SaveCurrentUserPhotoValidator : AbstractValidator<SaveCurrentUserPhotoRequest>
{
    private const int MaxBytes = 1024 * 1024;

    public SaveCurrentUserPhotoValidator()
    {
        RuleFor(request => request.Image)
            .NotEmpty()
            .Must(IsJpegWithinLimit)
            .WithMessage("The photo must be a JPEG of at most 1 MB.");
    }

    private static bool IsJpegWithinLimit(string image)
    {
        byte[] bytes = new byte[MaxBytes];

        // Fails when it isn't Base64, and when it doesn't fit.
        return Convert.TryFromBase64String(image, bytes, out int written)
            && written >= 3
            && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF;
    }
}
