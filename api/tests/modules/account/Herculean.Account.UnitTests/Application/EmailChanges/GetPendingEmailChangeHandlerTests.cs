using Herculean.Account.Application.Auth;
using Herculean.Account.Application.EmailChanges.GetPendingEmailChange;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Application.EmailChanges;

public sealed class GetPendingEmailChangeHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 8, 12, 0, 0, TimeSpan.Zero);

    private readonly User _user = User.Create("filip@example.com", "hash", "Europe/Zagreb");
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeUserRepository _userRepository = new();
    private readonly GetPendingEmailChangeHandler _handler;

    public GetPendingEmailChangeHandlerTests()
    {
        _userRepository.Add(_user);
        _currentUserAccessor.UserId = _user.Id.Value;
        _handler = new GetPendingEmailChangeHandler(new CurrentUser(_currentUserAccessor), _userRepository, new FakeTimeProvider(Now));
    }

    [Fact]
    public async Task AnOpenLinkShowsItsAddress()
    {
        _user.AddEmailChangeToken("new@example.com", "hash:token", Now.AddMinutes(1));

        Result<PendingEmailChangeResponse> result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.Value.ShouldBe(new PendingEmailChangeResponse("new@example.com"));
    }

    [Fact]
    public async Task AnExpiredLinkShowsNothing()
    {
        _user.AddEmailChangeToken("new@example.com", "hash:token", Now);

        Result<PendingEmailChangeResponse> result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.Value.ShouldBe(new PendingEmailChangeResponse(null));
    }

    [Fact]
    public async Task NoLinkShowsNothing()
    {
        Result<PendingEmailChangeResponse> result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.Value.ShouldBe(new PendingEmailChangeResponse(null));
    }

    [Fact]
    public async Task AccountThatNoLongerExistsIsNotFound()
    {
        _currentUserAccessor.UserId = Guid.CreateVersion7();

        Result<PendingEmailChangeResponse> result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.NotFound);
    }
}
