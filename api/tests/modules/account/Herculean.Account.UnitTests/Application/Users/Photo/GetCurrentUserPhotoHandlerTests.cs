using Herculean.Account.Application.Users.GetCurrentUserPhoto;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.Users.Photo;

public sealed class GetCurrentUserPhotoHandlerTests
{
    private readonly UserPhotoHandlerFixture _fixture = new();
    private readonly GetCurrentUserPhotoHandler _handler;

    public GetCurrentUserPhotoHandlerTests()
    {
        _handler = new GetCurrentUserPhotoHandler(_fixture.CurrentUser, _fixture.UserRepository);
    }

    [Fact]
    public async Task APhotoComesBackAsBase64()
    {
        _fixture.User.SetPhoto(UserPhotoHandlerFixture.Jpeg);

        Result<UserPhotoResponse> result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.Value.ShouldBe(new UserPhotoResponse(Convert.ToBase64String(UserPhotoHandlerFixture.Jpeg)));
    }

    [Fact]
    public async Task NoPhotoIsNull()
    {
        Result<UserPhotoResponse> result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.Value.ShouldBe(new UserPhotoResponse(null));
    }

    [Fact]
    public async Task AccountThatNoLongerExistsIsNotFound()
    {
        _fixture.CurrentUserAccessor.UserId = Guid.CreateVersion7();

        Result<UserPhotoResponse> result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.NotFound);
    }
}
