using Herculean.Account.Contracts;
using Herculean.SharedKernel.Auth;
using Herculean.Training.Application.AccountDeleted;
using Herculean.Training.Application.Auth;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Settings;
using Herculean.Training.Infrastructure;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.UnitTests.Application.AccountDeleted;

public sealed class AccountDeletedIntegrationEventHandlerTests : IDisposable
{
    private readonly UserId _userId = UserId.From(Guid.CreateVersion7());
    private readonly UserId _otherUserId = UserId.From(Guid.CreateVersion7());
    private readonly TrainingDbContext _dbContext = new(
        new DbContextOptionsBuilder<TrainingDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
        new CurrentUser(new NoCurrentUserAccessor()));
    private readonly AccountDeletedIntegrationEventHandler _handler;

    public AccountDeletedIntegrationEventHandlerTests()
    {
        _handler = new AccountDeletedIntegrationEventHandler(new UserDataRepository(_dbContext), _dbContext);
    }

    [Fact]
    public async Task DeletesEverythingTheUserHasAndNothingElse()
    {
        await SaveRowsForAsync(_userId);
        await SaveRowsForAsync(_otherUserId);

        await HandleAsync();

        (await UserIdsOfGroupsAsync()).ShouldAllBe(userId => userId == _otherUserId);
        (await UserIdsOfGroupsAsync()).ShouldNotBeEmpty();
        (await _dbContext.Exercises.IgnoreQueryFilters().Select(row => row.UserId).ToListAsync(TestContext.Current.CancellationToken)).ShouldBe([_otherUserId]);
        (await _dbContext.WorkoutSettings.IgnoreQueryFilters().Select(row => row.UserId).ToListAsync(TestContext.Current.CancellationToken)).ShouldBe([_otherUserId]);
    }

    [Fact]
    public async Task SoftDeletedRowsGoToo()
    {
        Group deleted = Group.CreateStarting(_userId)[0];
        _dbContext.Groups.Add(deleted);
        _dbContext.Entry(deleted).Property(group => group.DeletedAtUtc).CurrentValue = DateTimeOffset.UnixEpoch;
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        _dbContext.ChangeTracker.Clear();

        await HandleAsync();

        (await UserIdsOfGroupsAsync()).ShouldBeEmpty();
    }

    [Fact]
    public async Task TheEventSentTwiceChangesNothingMore()
    {
        await SaveRowsForAsync(_userId);

        await HandleAsync();
        await HandleAsync();

        (await UserIdsOfGroupsAsync()).ShouldBeEmpty();
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    private Task HandleAsync() =>
        _handler.HandleAsync(new AccountDeletedIntegrationEvent(_userId.Value), TestContext.Current.CancellationToken);

    private Task<List<UserId>> UserIdsOfGroupsAsync() =>
        _dbContext.Groups.IgnoreQueryFilters().Select(group => group.UserId).ToListAsync(TestContext.Current.CancellationToken);

    private async Task SaveRowsForAsync(UserId userId)
    {
        IReadOnlyList<Group> groups = Group.CreateStarting(userId);
        _dbContext.Groups.AddRange(groups);
        _dbContext.Exercises.Add(Exercise.Create(userId, "Bench press", groups[0].Id, [groups[1].Id]));
        _dbContext.WorkoutSettings.Add(WorkoutSettings.CreateStarting(userId));
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        _dbContext.ChangeTracker.Clear();
    }

    private sealed class NoCurrentUserAccessor : ICurrentUserAccessor
    {
        public Guid UserId => throw new InvalidOperationException("No user is signed in.");
    }
}
