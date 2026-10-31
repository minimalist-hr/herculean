using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Users;
using Herculean.Account.Application.Users.UpdateCurrentUser;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.Users.UpdateCurrentUser;

public sealed class UpdateCurrentUserHandlerTests
{
    private readonly User _user = User.Create("filip@example.com", "hash", "Europe/Zagreb");
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly UpdateCurrentUserHandler _handler;

    public UpdateCurrentUserHandlerTests()
    {
        _userRepository.Add(_user);
        _currentUserAccessor.UserId = _user.Id.Value;
        _handler = new UpdateCurrentUserHandler(new UpdateCurrentUserValidator(), new CurrentUser(_currentUserAccessor), _userRepository, _unitOfWork);
    }

    [Fact]
    public async Task SentFieldsChangeAndTheUserComesBack()
    {
        Result<UserResponse> result = await _handler.HandleAsync(
            new UpdateCurrentUserRequest(" Filip ", Units.Imperial, TimeZone: null),
            TestContext.Current.CancellationToken);

        result.Value.ShouldBe(new UserResponse("filip@example.com", "Filip", Units.Imperial, "Europe/Zagreb"));
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task FieldsLeftOutStayTheSame()
    {
        _user.ChangeName("Filip");

        Result<UserResponse> result = await _handler.HandleAsync(
            new UpdateCurrentUserRequest(Name: null, Units: null, "Europe/London"),
            TestContext.Current.CancellationToken);

        result.Value.ShouldBe(new UserResponse("filip@example.com", "Filip", Units.Metric, "Europe/London"));
    }

    [Fact]
    public async Task InvalidRequestFailsWithFieldErrors()
    {
        Result<UserResponse> result = await _handler.HandleAsync(
            new UpdateCurrentUserRequest(" ", Units: null, TimeZone: null),
            TestContext.Current.CancellationToken);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("name");
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task UserThatNoLongerExistsIsNotFound()
    {
        _currentUserAccessor.UserId = Guid.CreateVersion7();

        Result<UserResponse> result = await _handler.HandleAsync(
            new UpdateCurrentUserRequest("Filip", Units: null, TimeZone: null),
            TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.NotFound);
    }
}
