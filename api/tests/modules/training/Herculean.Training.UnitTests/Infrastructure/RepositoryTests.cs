using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Settings;
using Herculean.Training.Infrastructure;
using Herculean.Training.Infrastructure.Groups;
using Herculean.Training.Infrastructure.Settings;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.UnitTests.Infrastructure;

public sealed class RepositoryTests : IDisposable
{
    private readonly UserId _userId = UserId.From(Guid.CreateVersion7());
    private readonly TrainingDbContext _dbContext = new(new DbContextOptionsBuilder<TrainingDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .Options);

    [Fact]
    public async Task WorkoutSettingsExistOnlyForTheirUser()
    {
        WorkoutSettingsRepository workoutSettingsRepository = new(_dbContext);
        workoutSettingsRepository.Add(WorkoutSettings.CreateStarting(_userId));
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        (await workoutSettingsRepository.ExistsForUserAsync(_userId, TestContext.Current.CancellationToken)).ShouldBeTrue();
        (await workoutSettingsRepository.ExistsForUserAsync(UserId.From(Guid.CreateVersion7()), TestContext.Current.CancellationToken)).ShouldBeFalse();
    }

    [Fact]
    public async Task AddedGroupsAreSaved()
    {
        new GroupRepository(_dbContext).AddRange(Group.CreateStarting(_userId));
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        _dbContext.ChangeTracker.Clear();
        (await _dbContext.Groups.CountAsync(group => group.UserId == _userId, TestContext.Current.CancellationToken)).ShouldBe(6);
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
