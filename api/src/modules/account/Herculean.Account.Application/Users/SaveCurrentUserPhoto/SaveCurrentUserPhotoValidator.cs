using FluentValidation;

using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.Users.SaveCurrentUserPhoto;

internal sealed class SaveCurrentUserPhotoValidator : AbstractValidator<SaveCurrentUserPhotoRequest>
{
    public SaveCurrentUserPhotoValidator()
    {
        RuleFor(request => request.Image)
            .NotEmpty()
            .MustBeJpeg()
            .WithMessage("The photo must be a JPEG of at most 1 MB.");
    }
}
