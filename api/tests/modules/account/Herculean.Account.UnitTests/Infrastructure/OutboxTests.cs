using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure;
using Herculean.SharedKernel.Events;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Infrastructure;

public sealed class OutboxTests : IDisposable
{
    private static readonly DateTimeOffset Now = new(2026, 10, 31, 18, 0, 0, TimeSpan.Zero);

    private readonly OutboxSignal<AccountDbContext> _outboxSignal = new();
    private readonly AccountDbContext _dbContext;

    public OutboxTests()
    {
        _dbContext = new AccountDbContext(
            new DbContextOptionsBuilder<AccountDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
            _outboxSignal);
    }

    [Fact]
    public async Task AddedEventIsSavedWithTheUnitOfWork()
    {
        Guid userId = Guid.CreateVersion7();
        new Outbox(_dbContext, new FakeTimeProvider(Now)).Add(new AccountCreatedIntegrationEvent(userId));

        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        OutboxMessage message = await _dbContext.Set<OutboxMessage>().SingleAsync(TestContext.Current.CancellationToken);
        message.Type.ShouldBe(typeof(AccountCreatedIntegrationEvent).FullName);
        message.Content.ShouldContain(userId.ToString());
        message.OccurredAtUtc.ShouldBe(Now);
    }

    [Fact]
    public async Task ASaveWithAnEventWakesTheJob()
    {
        new Outbox(_dbContext, new FakeTimeProvider(Now)).Add(new AccountCreatedIntegrationEvent(Guid.CreateVersion7()));

        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        (await _outboxSignal.WaitAsync(TimeSpan.Zero, TestContext.Current.CancellationToken)).ShouldBeTrue();
    }

    [Fact]
    public async Task ASaveWithoutAnEventLeavesTheJobAsleep()
    {
        _dbContext.Users.Add(User.Create("filip@example.com", "hash", "Europe/Zagreb"));

        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        (await _outboxSignal.WaitAsync(TimeSpan.Zero, TestContext.Current.CancellationToken)).ShouldBeFalse();
    }

    public void Dispose()
    {
        _dbContext.Dispose();
        _outboxSignal.Dispose();
    }
}
