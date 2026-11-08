using Herculean.SharedKernel.Entities;

namespace Herculean.Account.Domain.Users;

/// <summary>A JPEG, in its own table so that reading a user doesn't load it.</summary>
internal sealed class UserPhoto : Entity<UserPhotoId>
{
    private UserPhoto(UserPhotoId id, UserId userId, byte[] image) : base(id)
    {
        UserId = userId;
        Image = image;
    }

    public UserId UserId { get; private set; }

    public byte[] Image { get; private set; }

    internal static UserPhoto Create(UserId userId, byte[] image) => new(UserPhotoId.New(), userId, image);

    internal void Replace(byte[] image)
    {
        Image = image;
    }
}
