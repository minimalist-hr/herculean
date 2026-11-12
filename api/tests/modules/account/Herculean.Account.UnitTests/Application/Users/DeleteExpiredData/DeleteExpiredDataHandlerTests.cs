using Herculean.Account.Application.Users.DeleteExpiredData;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Application.Users.DeleteExpiredData;

public sealed class DeleteExpiredDataHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 22, 12, 0, 0, TimeSpan.Zero);

    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeOutbox _outbox = new();
    private readonly DeleteExpiredDataHandler _handler;

    public DeleteExpiredDataHandlerTests()
    {
        _handler = new DeleteExpiredDataHandler(_userRepository, _outbox, new FakeTimeProvider(Now));
    }

    [Fact]
    public async Task DeletesExpiredTokensAsOfNow()
    {
        await _handler.HandleAsync(TestContext.Current.CancellationToken);

        _userRepository.ExpiredTokensDeletedAt.ShouldBe(Now);
    }

    [Fact]
    public async Task DeletesTheSentOutboxMessages()
    {
        await _handler.HandleAsync(TestContext.Current.CancellationToken);

        _outbox.SentDeleted.ShouldBeTrue();
    }
}
