using Herculean.Account.Application.Users.DeleteDueAccounts;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Application.Users.DeleteDueAccounts;

public sealed class DeleteDueAccountsHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 22, 12, 0, 0, TimeSpan.Zero);

    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeOutbox _outbox = new();
    private readonly DeleteDueAccountsHandler _handler;

    public DeleteDueAccountsHandlerTests()
    {
        _handler = new DeleteDueAccountsHandler(_userRepository, _unitOfWork, _outbox, new FakeTimeProvider(Now));
    }

    private User AddUser(string email, DateTimeOffset? scheduledAt)
    {
        User user = User.Create(email, "hash", "Europe/Zagreb");
        if (scheduledAt is DateTimeOffset at)
        {
            user.ScheduleDeletion(at);
        }

        _userRepository.Add(user);

        return user;
    }

    [Fact]
    public async Task DeletesAnAccountWhoseWaitIsOverAndTellsEveryone()
    {
        User due = AddUser("due@example.com", Now.AddDays(-14));

        await _handler.HandleAsync(TestContext.Current.CancellationToken);

        _userRepository.Users.ShouldBeEmpty();
        _outbox.Events.ShouldBe(
        [
            new AccountDeletedIntegrationEvent(due.Id.Value),
            new AccountDeletionNoticeRequestedIntegrationEvent("due@example.com", Now, "Europe/Zagreb"),
        ]);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task LeavesAccountsStillWaitingOrNeverScheduled()
    {
        AddUser("waiting@example.com", Now.AddDays(-13));
        AddUser("active@example.com", scheduledAt: null);

        await _handler.HandleAsync(TestContext.Current.CancellationToken);

        _userRepository.Users.Count.ShouldBe(2);
        _outbox.Events.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeFalse();
    }
}
