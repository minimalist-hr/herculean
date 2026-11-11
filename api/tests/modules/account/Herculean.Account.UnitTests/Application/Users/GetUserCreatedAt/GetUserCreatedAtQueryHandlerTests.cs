using Herculean.Account.Application.Users.GetUserStats;
using Herculean.Account.Application.Users;
using Herculean.Account.Application.Users.GetUserCreatedAt;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.UnitTests.Application.Users.GetUserCreatedAt;

public sealed class GetUserCreatedAtQueryHandlerTests
{
    [Fact]
    public async Task WhenTheUserWasCreatedIsTheAnswer()
    {
        Guid userId = Guid.CreateVersion7();
        DateTimeOffset createdAtUtc = new(2026, 10, 15, 12, 0, 0, TimeSpan.Zero);
        GetUserCreatedAtQueryHandler handler = new(new FakeUserReadRepository(UserId.From(userId), createdAtUtc));

        DateTimeOffset answer = await handler.HandleAsync(new GetUserCreatedAtQuery(userId), TestContext.Current.CancellationToken);

        answer.ShouldBe(createdAtUtc);
    }

    private sealed class FakeUserReadRepository(UserId userId, DateTimeOffset createdAtUtc) : IUserReadRepository
    {
        public Task<string> GetTimeZoneAsync(UserId id, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Not used here.");

        public Task<DateTimeOffset> GetCreatedAtUtcAsync(UserId id, CancellationToken cancellationToken) =>
            id == userId ? Task.FromResult(createdAtUtc) : throw new InvalidOperationException("No such user.");

        public Task<UserCounts> CountUsersAsync(DateTimeOffset since, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Not used here.");

        public Task<IReadOnlyList<UserContact>> ListContactsAsync(IReadOnlyCollection<UserId> ids, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Not used here.");
    }
}
