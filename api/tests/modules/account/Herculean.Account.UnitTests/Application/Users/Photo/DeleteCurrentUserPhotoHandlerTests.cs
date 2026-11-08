using Herculean.Account.Application.Users.DeleteCurrentUserPhoto;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.Users.Photo;

public sealed class DeleteCurrentUserPhotoHandlerTests
{
    private readonly UserPhotoHandlerFixture _fixture = new();
    private readonly DeleteCurrentUserPhotoHandler _handler;

    public DeleteCurrentUserPhotoHandlerTests()
    {
        _handler = new DeleteCurrentUserPhotoHandler(_fixture.CurrentUser, _fixture.UserRepository, _fixture.UnitOfWork);
    }

    [Fact]
    public async Task ThePhotoIsRemoved()
    {
        _fixture.User.SetPhoto(UserPhotoHandlerFixture.Jpeg);

        Result result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
        _fixture.User.Photo.ShouldBeNull();
        _fixture.UnitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task NoPhotoIsStillASuccess()
    {
        Result result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task AccountThatNoLongerExistsIsNotFound()
    {
        _fixture.CurrentUserAccessor.UserId = Guid.CreateVersion7();

        Result result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.NotFound);
    }
}
