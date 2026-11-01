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

public sealed class RepositoryTests : IDisposable
{
    private readonly UserId _userId = UserId.From(Guid.CreateVersion7());
    private readonly TrainingDbContext _dbContext;

    public RepositoryTests()
    {
        _dbContext = new TrainingDbContext(
            new DbContextOptionsBuilder<TrainingDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
            new CurrentUser(new FakeCurrentUserAccessor { UserId = _userId.Value }));
    }

    [Fact]
    public async Task WorkoutSettingsExistOnlyForTheirUser()
    {
        WorkoutSettingsRepository workoutSettingsRepository = new(_dbContext);
        workoutSettingsRepository.Add(WorkoutSettings.CreateStarting(_userId));
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        (await workoutSettingsRepository.ExistsForUserAsync(_userId, TestContext.Current.CancellationToken)).ShouldBeTrue();
        (await workoutSettingsRepository.ExistsForUserAsync(UserId.From(Guid.CreateVersion7()), TestContext.Current.CancellationToken)).ShouldBeFalse();
        (await workoutSettingsRepository.GetForCurrentUserAsync(TestContext.Current.CancellationToken)).ShouldNotBeNull().UserId.ShouldBe(_userId);
    }

    [Fact]
    public async Task AddedGroupsAreSaved()
    {
        GroupRepository groupRepository = new(_dbContext);
        groupRepository.AddRange(Group.CreateStarting(_userId));
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        _dbContext.ChangeTracker.Clear();
        (await _dbContext.Groups.CountAsync(group => group.UserId == _userId, TestContext.Current.CancellationToken)).ShouldBe(6);
        (await groupRepository.AnyForUserAsync(_userId, TestContext.Current.CancellationToken)).ShouldBeTrue();
        (await groupRepository.AnyForUserAsync(UserId.From(Guid.CreateVersion7()), TestContext.Current.CancellationToken)).ShouldBeFalse();
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
