using Herculean.Account.Application.Auth;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.UnitTests.Application.Users.Photo;

/// <summary>A signed-in user, and the stores the photo handlers need.</summary>
internal sealed class UserPhotoHandlerFixture
{
    public static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0x01];

    public UserPhotoHandlerFixture()
    {
        UserRepository.Add(User);
        CurrentUserAccessor.UserId = User.Id.Value;
    }

    public User User { get; } = Herculean.Account.Domain.Users.User.Create("filip@example.com", "hash", "Europe/Zagreb");

    public FakeCurrentUserAccessor CurrentUserAccessor { get; } = new();

    public FakeUserRepository UserRepository { get; } = new();

    public FakeUnitOfWork UnitOfWork { get; } = new();

    public CurrentUser CurrentUser => new(CurrentUserAccessor);
}
