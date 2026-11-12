using Herculean.Account.Application.Users.CloseUserAccount;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;
using Herculean.Account.Contracts;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Application.Users.CloseUserAccount;

public sealed class CloseUserAccountHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);

    private readonly User _user = User.Create("ana@example.com", "hash", "Europe/Zagreb");
    private readonly User _admin = User.CreateAdmin("admin@minimalist.hr", "hash");
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeOutbox _outbox = new();
    private readonly CloseUserAccountHandler _handler;

    public CloseUserAccountHandlerTests()
    {
        _userRepository.Add(_user);
        _userRepository.Add(_admin);
        _handler = new CloseUserAccountHandler(_userRepository, _unitOfWork, _outbox, new FakeTimeProvider(Now));
    }

    private Task<Result> RunAsync(User user) => _handler.HandleAsync(user.Id.Value, TestContext.Current.CancellationToken);

    [Fact]
    public async Task AnAdminIsNotFound()
    {
        (await RunAsync(_admin)).Error.ShouldBe(UserErrors.NotFound);
    }

    [Fact]
    public async Task AnUnknownUserIsNotFound()
    {
        Result result = await _handler.HandleAsync(Guid.CreateVersion7(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.NotFound);
    }

    [Fact]
    public async Task TheAccountIsClosedSignedOutAndToldWhy()
    {
        _user.AddRefreshToken("hash:phone", Now.AddDays(1));

        Result result = await RunAsync(_user);

        result.IsSuccess.ShouldBeTrue();
        _user.IsClosed.ShouldBeTrue();
        _user.DeletionScheduledForUtc.ShouldBe(Now.AddDays(14));
        _user.RefreshTokens.ShouldBeEmpty();
        _outbox.Events.ShouldHaveSingleItem().ShouldBe(new AccountClosedIntegrationEvent("ana@example.com", Now.AddDays(14), "Europe/Zagreb"));
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AnAccountTheUserDeletedKeepsItsDate()
    {
        _user.ScheduleDeletion(Now.AddDays(-3));

        Result result = await RunAsync(_user);

        result.IsSuccess.ShouldBeTrue();
        _user.IsClosed.ShouldBeTrue();
        _user.DeletionScheduledForUtc.ShouldBe(Now.AddDays(11));
        _outbox.Events.ShouldHaveSingleItem().ShouldBe(new AccountClosedIntegrationEvent("ana@example.com", Now.AddDays(11), "Europe/Zagreb"));
    }

    [Fact]
    public async Task AClosedAccountStaysAsItIs()
    {
        _user.Close(Now.AddDays(-3));

        Result result = await RunAsync(_user);

        result.IsSuccess.ShouldBeTrue();
        _user.DeletionScheduledForUtc.ShouldBe(Now.AddDays(11));
        _outbox.Events.ShouldBeEmpty();
    }
}
