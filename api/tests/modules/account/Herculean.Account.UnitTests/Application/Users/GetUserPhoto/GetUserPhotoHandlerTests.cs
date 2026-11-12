using Herculean.Account.Application.Users.GetCurrentUserPhoto;
using Herculean.Account.Application.Users.GetUserPhoto;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.Users.GetUserPhoto;

public sealed class GetUserPhotoHandlerTests
{
    private readonly User _user = User.Create("ana@example.com", "hash", "Europe/Zagreb");
    private readonly User _admin = User.CreateAdmin("admin@minimalist.hr", "hash");
    private readonly FakeUserRepository _userRepository = new();
    private readonly GetUserPhotoHandler _handler;

    public GetUserPhotoHandlerTests()
    {
        _userRepository.Add(_user);
        _userRepository.Add(_admin);
        _handler = new GetUserPhotoHandler(_userRepository);
    }

    private Task<Result<UserPhotoResponse>> GetAsync(User user) => _handler.HandleAsync(user.Id.Value, TestContext.Current.CancellationToken);

    [Fact]
    public async Task ThePhotoComesAsBase64()
    {
        _user.SetPhoto([1, 2, 3]);

        (await GetAsync(_user)).Value.Image.ShouldBe("AQID");
    }

    [Fact]
    public async Task WithoutAPhotoItIsNull()
    {
        (await GetAsync(_user)).Value.Image.ShouldBeNull();
    }

    [Fact]
    public async Task AnAdminIsNotFound()
    {
        (await GetAsync(_admin)).Error.ShouldBe(UserErrors.NotFound);
    }
}
