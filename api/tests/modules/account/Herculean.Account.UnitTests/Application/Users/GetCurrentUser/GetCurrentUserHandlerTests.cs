using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Users;
using Herculean.Account.Application.Users.GetCurrentUser;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.Users.GetCurrentUser;

public sealed class GetCurrentUserHandlerTests
{
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeUserRepository _userRepository = new();
    private readonly GetCurrentUserHandler _handler;

    public GetCurrentUserHandlerTests()
    {
        _handler = new GetCurrentUserHandler(new CurrentUser(_currentUserAccessor), _userRepository);
    }

    [Fact]
    public async Task SignedInUserComesBack()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        _userRepository.Add(user);
        _currentUserAccessor.UserId = user.Id.Value;

        Result<UserResponse> result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.Value.ShouldBe(new UserResponse("filip@example.com", Name: null, Units.Metric, Theme.MatchPhone, Color.RacingBlue, "Europe/Zagreb"));
    }

    [Fact]
    public async Task UserThatNoLongerExistsIsNotFound()
    {
        Result<UserResponse> result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.NotFound);
    }
}
