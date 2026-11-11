using Herculean.Account.Application.Users.GetUserStats;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure;
using Herculean.Account.Infrastructure.Users;
using Herculean.SharedKernel.Events;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Application.Users.GetUserStats;

public sealed class GetUserStatsHandlerTests : IDisposable
{
    private static readonly DateTimeOffset Now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);
    private readonly AccountDbContext _dbContext = new(
        new DbContextOptionsBuilder<AccountDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
        new OutboxSignal<AccountDbContext>());

    [Fact]
    public async Task UsersAreCountedWithoutAdmins()
    {
        await SaveUserAsync(Now.AddDays(-1));
        await SaveUserAsync(Now.AddDays(-3), deleting: true);
        await SaveUserAsync(Now.AddDays(-10));
        await SaveUserAsync(Now.AddDays(-60));
        await SaveAsync(User.CreateAdmin("admin@minimalist.hr", "hash"), Now.AddDays(-1));

        UserStatsResponse stats = await new GetUserStatsHandler(new UserReadRepository(_dbContext), new FakeTimeProvider(Now))
            .HandleAsync(TestContext.Current.CancellationToken);

        stats.Total.ShouldBe(4);
        stats.NewThisWeek.ShouldBe(2);
        stats.DeletingSoon.ShouldBe(1);
        stats.NewPerWeek.ShouldBe([0, 0, 1, 2]);
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    private Task SaveUserAsync(DateTimeOffset createdAtUtc, bool deleting = false)
    {
        User user = User.Create($"{Guid.NewGuid()}@example.com", "hash", "Europe/Zagreb");
        if (deleting)
        {
            user.ScheduleDeletion(Now);
        }

        return SaveAsync(user, createdAtUtc);
    }

    private async Task SaveAsync(User user, DateTimeOffset createdAtUtc)
    {
        _dbContext.Users.Add(user);
        _dbContext.Entry(user).Property(saved => saved.CreatedAtUtc).CurrentValue = createdAtUtc;
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
    }
}
