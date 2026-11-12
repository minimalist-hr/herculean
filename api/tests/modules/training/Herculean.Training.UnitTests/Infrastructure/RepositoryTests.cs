using Herculean.Training.Application.Auth;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Settings;
using Herculean.Training.Infrastructure;
using Herculean.Training.Infrastructure.Exercises;
using Herculean.Training.Infrastructure.Groups;
using Herculean.Training.Infrastructure.Routines;
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
        groupRepository.AddRange(TestGroups.Create(_userId));
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        _dbContext.ChangeTracker.Clear();
        (await _dbContext.Groups.CountAsync(group => group.UserId == _userId, TestContext.Current.CancellationToken)).ShouldBe(6);
        (await groupRepository.AnyForUserAsync(_userId, TestContext.Current.CancellationToken)).ShouldBeTrue();
        (await groupRepository.AnyForUserAsync(UserId.From(Guid.CreateVersion7()), TestContext.Current.CancellationToken)).ShouldBeFalse();
    }

    [Fact]
    public async Task OnlyTheCurrentUsersGroupsThatAreNotDeletedExist()
    {
        IReadOnlyList<Group> groups = await SaveGroupsAsync(_userId);
        IReadOnlyList<Group> others = await SaveGroupsAsync(UserId.From(Guid.CreateVersion7()));
        _dbContext.Entry(groups[0]).Property(group => group.DeletedAtUtc).CurrentValue = DateTimeOffset.UnixEpoch;
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        GroupRepository groupRepository = new(_dbContext);

        (await groupRepository.AllExistAsync([groups[1].Id, groups[2].Id], TestContext.Current.CancellationToken)).ShouldBeTrue();
        (await groupRepository.AllExistAsync([groups[0].Id, groups[1].Id], TestContext.Current.CancellationToken)).ShouldBeFalse();
        (await groupRepository.AllExistAsync([others[0].Id], TestContext.Current.CancellationToken)).ShouldBeFalse();
    }

    [Fact]
    public async Task AnAddedExerciseIsSavedWithWhatItAlsoWorks()
    {
        IReadOnlyList<Group> groups = await SaveGroupsAsync(_userId);
        ExerciseRepository exerciseRepository = new(_dbContext);

        exerciseRepository.Add(Exercise.Create(_userId, "Pull-up", groups[1].Id, [groups[3].Id]));
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        _dbContext.ChangeTracker.Clear();
        Exercise saved = await _dbContext.Exercises.Include(exercise => exercise.AlsoWorks).SingleAsync(TestContext.Current.CancellationToken);
        saved.AlsoWorks.ShouldHaveSingleItem().GroupId.ShouldBe(groups[3].Id);
        (await exerciseRepository.CountAsync(TestContext.Current.CancellationToken)).ShouldBe(1);
    }

    [Fact]
    public async Task ANameExistsRegardlessOfCaseButOnlyForTheCurrentUserAndNotWhenDeleted()
    {
        IReadOnlyList<Group> groups = await SaveGroupsAsync(_userId);
        ExerciseRepository exerciseRepository = new(_dbContext);
        Exercise deleted = Exercise.Create(_userId, "Pec deck", groups[0].Id, []);
        exerciseRepository.Add(deleted);
        exerciseRepository.Add(Exercise.Create(_userId, "Bench press", groups[0].Id, []));
        exerciseRepository.Add(Exercise.Create(UserId.From(Guid.CreateVersion7()), "Pull-up", groups[0].Id, []));
        _dbContext.Entry(deleted).Property(exercise => exercise.DeletedAtUtc).CurrentValue = DateTimeOffset.UnixEpoch;
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        (await exerciseRepository.NameExistsAsync(" BENCH press ", null, TestContext.Current.CancellationToken)).ShouldBeTrue();
        (await exerciseRepository.NameExistsAsync("Pull-up", null, TestContext.Current.CancellationToken)).ShouldBeFalse();
        (await exerciseRepository.NameExistsAsync("Pec deck", null, TestContext.Current.CancellationToken)).ShouldBeFalse();
        (await exerciseRepository.CountAsync(TestContext.Current.CancellationToken)).ShouldBe(1);
    }

    [Fact]
    public async Task TheNameCheckCanLeaveOutOneExercise()
    {
        ExerciseRepository exerciseRepository = new(_dbContext);
        Exercise exercise = Exercise.Create(_userId, "Bench press", GroupId.New(), []);
        exerciseRepository.Add(exercise);
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        (await exerciseRepository.NameExistsAsync("BENCH PRESS", exercise.Id, TestContext.Current.CancellationToken)).ShouldBeFalse();
        (await exerciseRepository.NameExistsAsync("BENCH PRESS", ExerciseId.New(), TestContext.Current.CancellationToken)).ShouldBeTrue();
    }

    [Fact]
    public async Task AnExerciseComesWithItsAlsoWorks()
    {
        ExerciseRepository exerciseRepository = new(_dbContext);
        GroupId alsoWorksGroupId = GroupId.New();
        Exercise saved = Exercise.Create(_userId, "Bench press", GroupId.New(), [alsoWorksGroupId]);
        exerciseRepository.Add(saved);
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);
        _dbContext.ChangeTracker.Clear();

        Exercise? exercise = await exerciseRepository.GetAsync(saved.Id, TestContext.Current.CancellationToken);

        exercise.ShouldNotBeNull().AlsoWorks.ShouldHaveSingleItem().GroupId.ShouldBe(alsoWorksGroupId);
    }

    [Fact]
    public async Task ADeletedExerciseAndAnotherUsersAreLeftOut()
    {
        ExerciseRepository exerciseRepository = new(_dbContext);
        Exercise deleted = Exercise.Create(_userId, "Bench press", GroupId.New(), []);
        deleted.Delete(DateTimeOffset.UnixEpoch);
        Exercise other = Exercise.Create(UserId.From(Guid.CreateVersion7()), "Pec deck", GroupId.New(), []);
        exerciseRepository.Add(deleted);
        exerciseRepository.Add(other);
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        (await exerciseRepository.GetAsync(deleted.Id, TestContext.Current.CancellationToken)).ShouldBeNull();
        (await exerciseRepository.GetAsync(other.Id, TestContext.Current.CancellationToken)).ShouldBeNull();
    }

    [Fact]
    public async Task TheGroupNameCheckIgnoresCaseAndCanLeaveOutOneGroup()
    {
        IReadOnlyList<Group> groups = await SaveGroupsAsync(_userId);
        GroupRepository groupRepository = new(_dbContext);

        (await groupRepository.NameExistsAsync(" CHEST ", null, TestContext.Current.CancellationToken)).ShouldBeTrue();
        (await groupRepository.NameExistsAsync("CHEST", groups[0].Id, TestContext.Current.CancellationToken)).ShouldBeFalse();
    }

    [Fact]
    public async Task ADeletedGroupIsFoundOnlyAsDeleted()
    {
        IReadOnlyList<Group> groups = await SaveGroupsAsync(_userId);
        GroupRepository groupRepository = new(_dbContext);
        groups[0].Delete(DateTimeOffset.UnixEpoch);
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        (await groupRepository.GetAsync(groups[0].Id, TestContext.Current.CancellationToken)).ShouldBeNull();
        (await groupRepository.GetDeletedAsync(groups[0].Id, TestContext.Current.CancellationToken)).ShouldBe(groups[0]);
        (await groupRepository.GetDeletedAsync(groups[1].Id, TestContext.Current.CancellationToken)).ShouldBeNull();
        (await groupRepository.CountAsync(TestContext.Current.CancellationToken)).ShouldBe(groups.Count - 1);
        (await groupRepository.NextOrderAsync(TestContext.Current.CancellationToken)).ShouldBe(groups.Count);
    }

    [Fact]
    public async Task AGroupIsInUseByAnExerciseUsingItEitherWay()
    {
        IReadOnlyList<Group> groups = await SaveGroupsAsync(_userId);
        GroupRepository groupRepository = new(_dbContext);
        _dbContext.Exercises.Add(Exercise.Create(_userId, "Bench press", groups[0].Id, [groups[1].Id]));
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        (await groupRepository.IsInUseAsync(groups[0].Id, TestContext.Current.CancellationToken)).ShouldBeTrue();
        (await groupRepository.IsInUseAsync(groups[1].Id, TestContext.Current.CancellationToken)).ShouldBeTrue();
        (await groupRepository.IsInUseAsync(groups[2].Id, TestContext.Current.CancellationToken)).ShouldBeFalse();
    }

    [Fact]
    public async Task TheRoutineNameCheckIgnoresCaseAndCountSkipsDeleted()
    {
        RoutineRepository routineRepository = new(_dbContext);
        Routine deleted = Routine.Create(_userId, "Arms", []);
        routineRepository.Add(deleted);
        routineRepository.Add(Routine.Create(_userId, "Legs", []));
        _dbContext.Entry(deleted).Property(routine => routine.DeletedAtUtc).CurrentValue = DateTimeOffset.UnixEpoch;
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        (await routineRepository.NameExistsAsync(" LEGS ", null, TestContext.Current.CancellationToken)).ShouldBeTrue();
        (await routineRepository.NameExistsAsync("Arms", null, TestContext.Current.CancellationToken)).ShouldBeFalse();
        (await routineRepository.CountAsync(TestContext.Current.CancellationToken)).ShouldBe(1);
    }

    [Fact]
    public async Task AllExistIsFalseIfAnyExerciseIsMissingOrDeleted()
    {
        ExerciseRepository exerciseRepository = new(_dbContext);
        Exercise squat = Exercise.Create(_userId, "Squat", GroupId.New(), []);
        Exercise lunge = Exercise.Create(_userId, "Lunge", GroupId.New(), []);
        lunge.Delete(DateTimeOffset.UnixEpoch);
        exerciseRepository.Add(squat);
        exerciseRepository.Add(lunge);
        await ((IUnitOfWork)_dbContext).SaveChangesAsync(TestContext.Current.CancellationToken);

        (await exerciseRepository.AllExistAsync([squat.Id], TestContext.Current.CancellationToken)).ShouldBeTrue();
        (await exerciseRepository.AllExistAsync([squat.Id, lunge.Id], TestContext.Current.CancellationToken)).ShouldBeFalse();
        (await exerciseRepository.AllExistAsync([squat.Id, ExerciseId.New()], TestContext.Current.CancellationToken)).ShouldBeFalse();
    }

    private async Task<IReadOnlyList<Group>> SaveGroupsAsync(UserId userId)
    {
        IReadOnlyList<Group> groups = TestGroups.Create(userId);
        _dbContext.Groups.AddRange(groups);
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        return groups;
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
