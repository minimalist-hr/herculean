using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure;
using Herculean.Account.Infrastructure.Users;
using Herculean.SharedKernel.Events;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Account.UnitTests.Infrastructure.Users;

public sealed class UserReadRepositoryTests : IDisposable
{
    private readonly AccountDbContext _dbContext = new(
        new DbContextOptionsBuilder<AccountDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
        new OutboxSignal<AccountDbContext>());

    [Fact]
    public async Task TheUsersTimeZoneIsReturned()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        _dbContext.Users.Add(user);
        _dbContext.Users.Add(User.Create("other@example.com", "hash", "America/New_York"));
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        string timeZone = await new UserReadRepository(_dbContext).GetTimeZoneAsync(user.Id, TestContext.Current.CancellationToken);

        timeZone.ShouldBe("Europe/Zagreb");
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
