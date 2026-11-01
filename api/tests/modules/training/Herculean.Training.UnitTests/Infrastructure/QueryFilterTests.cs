using Herculean.SharedKernel.Auth;
using Herculean.Training.Application.Auth;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Settings;
using Herculean.Training.Infrastructure;
using Herculean.Training.Infrastructure.Groups;
using Herculean.Training.Infrastructure.Settings;
using Herculean.Training.UnitTests.Application;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.UnitTests.Infrastructure;

public sealed class QueryFilterTests : IDisposable
{
    private readonly string _databaseName = Guid.NewGuid().ToString();
    private readonly UserId _userId = UserId.From(Guid.CreateVersion7());
    private readonly UserId _otherUserId = UserId.From(Guid.CreateVersion7());
    private readonly TrainingDbContext _dbContext;
    private readonly TrainingDbContext _dbContextWithoutAUser;

    public QueryFilterTests()
    {
        _dbContext = CreateDbContext(new FakeCurrentUserAccessor { UserId = _userId.Value });
        _dbContextWithoutAUser = CreateDbContext(new NoCurrentUserAccessor());
    }

    [Fact]
    public async Task AUserSeesOnlyTheirOwnRows()
    {
        await SaveRowsForBothUsersAsync();

        (await _dbContext.Groups.Select(group => group.UserId).Distinct().ToListAsync(TestContext.Current.CancellationToken)).ShouldBe([_userId]);
        (await _dbContext.WorkoutSettings.Select(settings => settings.UserId).ToListAsync(TestContext.Current.CancellationToken)).ShouldBe([_userId]);
    }

    [Fact]
    public async Task DeletedRowsAreLeftOut()
    {
        Group deletedGroup = Group.CreateStarting(_userId)[0];
        _dbContext.Groups.Add(deletedGroup);
        _dbContext.Entry(deletedGroup).Property(group => group.DeletedAtUtc).CurrentValue = DateTimeOffset.UnixEpoch;
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        (await _dbContext.Groups.ToListAsync(TestContext.Current.CancellationToken)).ShouldBeEmpty();
    }

    [Fact]
    public async Task AQueryWithoutASignedInUserThrowsInsteadOfReadingEveryone()
    {
        await SaveRowsForBothUsersAsync();

        await Should.ThrowAsync<InvalidOperationException>(() => _dbContextWithoutAUser.Groups.ToListAsync(TestContext.Current.CancellationToken));
        await Should.ThrowAsync<InvalidOperationException>(() => _dbContextWithoutAUser.WorkoutSettings.ToListAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task TheAccountCreatedChecksWorkWithoutASignedInUser()
    {
        await SaveRowsForBothUsersAsync();

        (await new GroupRepository(_dbContextWithoutAUser).AnyForUserAsync(_otherUserId, TestContext.Current.CancellationToken)).ShouldBeTrue();
        (await new WorkoutSettingsRepository(_dbContextWithoutAUser).ExistsForUserAsync(_otherUserId, TestContext.Current.CancellationToken)).ShouldBeTrue();
    }

    [Fact]
    public async Task TheGroupCheckCountsDeletedGroups()
    {
        Group deletedGroup = Group.CreateStarting(_userId)[0];
        _dbContext.Groups.Add(deletedGroup);
        _dbContext.Entry(deletedGroup).Property(group => group.DeletedAtUtc).CurrentValue = DateTimeOffset.UnixEpoch;
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        (await new GroupRepository(_dbContextWithoutAUser).AnyForUserAsync(_userId, TestContext.Current.CancellationToken)).ShouldBeTrue();
    }

    public void Dispose()
    {
        _dbContext.Dispose();
        _dbContextWithoutAUser.Dispose();
    }

    private TrainingDbContext CreateDbContext(ICurrentUserAccessor currentUserAccessor) => new(
        new DbContextOptionsBuilder<TrainingDbContext>().UseInMemoryDatabase(_databaseName).Options,
        new CurrentUser(currentUserAccessor));

    private async Task SaveRowsForBothUsersAsync()
    {
        foreach (UserId userId in new[] { _userId, _otherUserId })
        {
            _dbContext.Groups.AddRange(Group.CreateStarting(userId));
            _dbContext.WorkoutSettings.Add(WorkoutSettings.CreateStarting(userId));
        }

        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        _dbContext.ChangeTracker.Clear();
    }

    private sealed class NoCurrentUserAccessor : ICurrentUserAccessor
    {
        public Guid UserId => throw new InvalidOperationException("No user is signed in.");
    }
}
