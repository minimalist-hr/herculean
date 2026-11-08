using System.ComponentModel;

namespace Herculean.Account.Application.Users.SaveCurrentUserPhoto;

[Description("The new profile photo.")]
internal sealed record SaveCurrentUserPhotoRequest(
    [property: Description("The photo as a Base64 JPEG, at most 1 MB.")] string Image);
