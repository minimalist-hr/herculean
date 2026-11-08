using Herculean.Account.Application.Users.SaveCurrentUserPhoto;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.Users.Photo;

public sealed class SaveCurrentUserPhotoHandlerTests
{
    private readonly UserPhotoHandlerFixture _fixture = new();
    private readonly SaveCurrentUserPhotoHandler _handler;

    public SaveCurrentUserPhotoHandlerTests()
    {
        _handler = new SaveCurrentUserPhotoHandler(new SaveCurrentUserPhotoValidator(), _fixture.CurrentUser, _fixture.UserRepository, _fixture.UnitOfWork);
    }

    private Task<Result> SaveAsync(string image) =>
        _handler.HandleAsync(new SaveCurrentUserPhotoRequest(image), TestContext.Current.CancellationToken);

    [Fact]
    public async Task AJpegIsSaved()
    {
        Result result = await SaveAsync(Convert.ToBase64String(UserPhotoHandlerFixture.Jpeg));

        result.IsSuccess.ShouldBeTrue();
        _fixture.User.Photo.ShouldNotBeNull().Image.ShouldBe(UserPhotoHandlerFixture.Jpeg);
        _fixture.UnitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task ANewPhotoReplacesTheOldOne()
    {
        _fixture.User.SetPhoto([0xFF, 0xD8, 0xFF, 0x00]);
        UserPhoto first = _fixture.User.Photo.ShouldNotBeNull();

        await SaveAsync(Convert.ToBase64String(UserPhotoHandlerFixture.Jpeg));

        _fixture.User.Photo.ShouldBeSameAs(first);
        first.Image.ShouldBe(UserPhotoHandlerFixture.Jpeg);
    }

    [Fact]
    public async Task AccountThatNoLongerExistsIsNotFound()
    {
        _fixture.CurrentUserAccessor.UserId = Guid.CreateVersion7();

        Result result = await SaveAsync(Convert.ToBase64String(UserPhotoHandlerFixture.Jpeg));

        result.Error.ShouldBe(UserErrors.NotFound);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not base64!")]
    [InlineData("iVBORw0KGgo=")]
    [InlineData("/9g=")]
    public async Task AnythingButAJpegFails(string image)
    {
        Result result = await SaveAsync(image);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
        _fixture.User.Photo.ShouldBeNull();
    }

    [Fact]
    public async Task APhotoOver1MbFails()
    {
        byte[] tooBig = new byte[(1024 * 1024) + 1];
        UserPhotoHandlerFixture.Jpeg.CopyTo(tooBig, 0);

        Result result = await SaveAsync(Convert.ToBase64String(tooBig));

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
    }
}
