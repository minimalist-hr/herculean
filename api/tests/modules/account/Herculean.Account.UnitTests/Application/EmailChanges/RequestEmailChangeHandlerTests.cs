using Herculean.Account.Application.Auth;
using Herculean.Account.Application.EmailChanges.RequestEmailChange;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.EmailChanges;

public sealed class RequestEmailChangeHandlerTests
{
    private readonly User _user = User.Create("filip@example.com", "hashed:password", "Europe/Zagreb");
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeOutbox _outbox = new();
    private readonly RequestEmailChangeHandler _handler;

    public RequestEmailChangeHandlerTests()
    {
        _userRepository.Add(_user);
        _currentUserAccessor.UserId = _user.Id.Value;
        _handler = new RequestEmailChangeHandler(
            new RequestEmailChangeValidator(),
            new CurrentUser(_currentUserAccessor),
            _userRepository,
            _unitOfWork,
            _outbox,
            new FakePasswordHasher());
    }

    private Task<Result> RequestAsync(string newEmail, string password = "password") =>
        _handler.HandleAsync(new RequestEmailChangeRequest(newEmail, password), TestContext.Current.CancellationToken);

    [Fact]
    public async Task RightPasswordAsksForTheLinkAndLeavesTheEmailAlone()
    {
        Result result = await RequestAsync(" New@Example.com ");

        result.IsSuccess.ShouldBeTrue();
        _outbox.Events.ShouldBe([new EmailChangeRequestedIntegrationEvent(_user.Id.Value, "new@example.com")]);
        _user.Email.ShouldBe("filip@example.com");
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task WrongPasswordFailsUnderCurrentPassword()
    {
        Result result = await RequestAsync("new@example.com", "wrong");

        result.Error.ShouldBe(UserErrors.WrongCurrentPassword);
        _outbox.Events.ShouldBeEmpty();
    }

    [Fact]
    public async Task WrongPasswordNeverTellsThatAnAddressIsTaken()
    {
        _userRepository.Add(User.Create("taken@example.com", "hash", "Europe/Zagreb"));

        Result result = await RequestAsync("taken@example.com", "wrong");

        result.Error.ShouldBe(UserErrors.WrongCurrentPassword);
    }

    [Fact]
    public async Task TheSameEmailFailsUnderNewEmail()
    {
        Result result = await RequestAsync("FILIP@example.com");

        result.Error.ShouldBe(UserErrors.SameEmail);
        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("newEmail");
        _outbox.Events.ShouldBeEmpty();
    }

    [Fact]
    public async Task AnAddressAnotherAccountUsesIsTaken()
    {
        _userRepository.Add(User.Create("taken@example.com", "hash", "Europe/Zagreb"));

        Result result = await RequestAsync("taken@example.com");

        result.Error.ShouldBe(UserErrors.EmailTaken);
        _outbox.Events.ShouldBeEmpty();
    }

    [Fact]
    public async Task AccountThatNoLongerExistsIsNotFound()
    {
        _currentUserAccessor.UserId = Guid.CreateVersion7();

        Result result = await RequestAsync("new@example.com");

        result.Error.ShouldBe(UserErrors.NotFound);
    }

    [Theory]
    [InlineData("", "password", "newEmail")]
    [InlineData("not-an-email", "password", "newEmail")]
    [InlineData("new@example.com", "", "currentPassword")]
    public async Task InvalidRequestFailsWithAFieldError(string newEmail, string password, string field)
    {
        Result result = await RequestAsync(newEmail, password);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
        result.Error.Fields.ShouldContainKey(field);
    }
}
