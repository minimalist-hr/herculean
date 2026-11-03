using Herculean.Account.Application.Users;
using Herculean.Account.Application.Users.GetUserTimeZone;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.UnitTests.Application.Users.GetUserTimeZone;

public sealed class GetUserTimeZoneQueryHandlerTests
{
    [Fact]
    public async Task TheUsersTimeZoneIsTheAnswer()
    {
        Guid userId = Guid.CreateVersion7();
        GetUserTimeZoneQueryHandler handler = new(new FakeUserReadRepository(UserId.From(userId), "Europe/Zagreb"));

        string timeZone = await handler.HandleAsync(new GetUserTimeZoneQuery(userId), TestContext.Current.CancellationToken);

        timeZone.ShouldBe("Europe/Zagreb");
    }

    private sealed class FakeUserReadRepository(UserId userId, string timeZone) : IUserReadRepository
    {
        public Task<string> GetTimeZoneAsync(UserId id, CancellationToken cancellationToken) =>
            id == userId ? Task.FromResult(timeZone) : throw new InvalidOperationException("No such user.");
    }
}
