using System.ComponentModel;

namespace Herculean.Account.Application.Users.GetCurrentUserPhoto;

[Description("The user's profile photo.")]
internal sealed record UserPhotoResponse(
    [property: Description("The photo as a Base64 JPEG, or null when there is none.")] string? Image);
