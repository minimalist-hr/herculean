using Herculean.Account.Application.Users.CancelUserDeletion;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.Users.CancelUserDeletion;

public sealed class CancelUserDeletionHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);

    private readonly User _user = User.Create("ana@example.com", "hash", "Europe/Zagreb");
    private readonly User _admin = User.CreateAdmin("admin@minimalist.hr", "hash");
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeOutbox _outbox = new();
    private readonly CancelUserDeletionHandler _handler;

    public CancelUserDeletionHandlerTests()
    {
        _userRepository.Add(_user);
        _userRepository.Add(_admin);
        _handler = new CancelUserDeletionHandler(_userRepository, _unitOfWork, _outbox);
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
    public async Task TheAccountStays()
    {
        _user.ScheduleDeletion(Now);

        Result result = await RunAsync(_user);

        result.IsSuccess.ShouldBeTrue();
        _user.DeletionScheduledForUtc.ShouldBeNull();
        _unitOfWork.Saved.ShouldBeTrue();
        _outbox.Events.ShouldBe([new AccountKeptIntegrationEvent(_user.Id.Value)]);
    }

    [Fact]
    public async Task AClosedAccountOpensAgain()
    {
        _user.Close(Now);

        await RunAsync(_user);

        _user.IsClosed.ShouldBeFalse();
        _user.DeletionScheduledForUtc.ShouldBeNull();
        _outbox.Events.ShouldBe([new AccountKeptIntegrationEvent(_user.Id.Value)]);
    }

    [Fact]
    public async Task AnAccountThatWasntGoingToBeDeletedGetsNoEmail()
    {
        Result result = await RunAsync(_user);

        result.IsSuccess.ShouldBeTrue();
        _outbox.Events.ShouldBeEmpty();
    }
}
