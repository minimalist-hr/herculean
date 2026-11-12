using Herculean.Account.Application.Users.RemoveUserPhoto;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.Users.RemoveUserPhoto;

public sealed class RemoveUserPhotoHandlerTests
{
    private readonly User _user = User.Create("ana@example.com", "hash", "Europe/Zagreb");
    private readonly User _admin = User.CreateAdmin("admin@minimalist.hr", "hash");
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeOutbox _outbox = new();
    private readonly RemoveUserPhotoHandler _handler;

    public RemoveUserPhotoHandlerTests()
    {
        _userRepository.Add(_user);
        _userRepository.Add(_admin);
        _handler = new RemoveUserPhotoHandler(_userRepository, _unitOfWork, _outbox);
    }

    private Task<Result> RunAsync(User user) => _handler.HandleAsync(user.Id.Value, TestContext.Current.CancellationToken);

    [Fact]
    public async Task ThePhotoIsRemovedAndTheUserToldWhy()
    {
        _user.SetPhoto([1, 2, 3]);

        Result result = await RunAsync(_user);

        result.IsSuccess.ShouldBeTrue();
        _user.Photo.ShouldBeNull();
        _outbox.Events.ShouldHaveSingleItem().ShouldBe(new ProfilePhotoRemovedIntegrationEvent("ana@example.com"));
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task WithoutAPhotoNothingIsSent()
    {
        Result result = await RunAsync(_user);

        result.IsSuccess.ShouldBeTrue();
        _outbox.Events.ShouldBeEmpty();
    }

    [Fact]
    public async Task AnAdminIsNotFound()
    {
        (await RunAsync(_admin)).Error.ShouldBe(UserErrors.NotFound);
    }
}
