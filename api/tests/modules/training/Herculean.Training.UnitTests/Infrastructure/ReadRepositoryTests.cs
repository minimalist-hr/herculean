using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Exercises.GetExercise;
using Herculean.Training.Application.Exercises.ListExercises;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Infrastructure;
using Herculean.Training.Infrastructure.Exercises;
using Herculean.Training.Infrastructure.Groups;
using Herculean.Training.UnitTests.Application;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.UnitTests.Infrastructure;

public sealed class ReadRepositoryTests : IDisposable
{
    private readonly UserId _userId = UserId.From(Guid.CreateVersion7());
    private readonly TrainingDbContext _dbContext;

    public ReadRepositoryTests()
    {
        _dbContext = new TrainingDbContext(
            new DbContextOptionsBuilder<TrainingDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
            new CurrentUser(new FakeCurrentUserAccessor { UserId = _userId.Value }));
    }

    [Fact]
    public async Task GroupsComeInTheirOrder()
    {
        await SaveGroupsAsync(_userId);

        List<GroupResponse> groups = await new GroupReadRepository(_dbContext).ListAsync(TestContext.Current.CancellationToken);

        groups.Select(group => group.Name).ShouldBe(Group.StartingNames);
    }

    [Fact]
    public async Task DeletedGroupsAndOtherUsersGroupsAreLeftOut()
    {
        IReadOnlyList<Group> groups = await SaveGroupsAsync(_userId);
        await SaveGroupsAsync(UserId.From(Guid.CreateVersion7()));
        await MarkDeletedAsync(groups[0]);

        List<GroupResponse> read = await new GroupReadRepository(_dbContext).ListAsync(TestContext.Current.CancellationToken);

        read.Select(group => group.Name).ShouldBe(Group.StartingNames.Skip(1));
    }

    [Fact]
    public async Task ExercisesComeByGroupOrderThenName()
    {
        IReadOnlyList<Group> groups = await SaveGroupsAsync(_userId);
        await SaveExerciseAsync("Pull-up", groups[1]);
        await SaveExerciseAsync("Pec deck", groups[0]);
        await SaveExerciseAsync("Bench press", groups[0]);

        List<ExerciseListItemResponse> exercises = await ListAsync();

        exercises.Select(exercise => exercise.Name).ShouldBe(["Bench press", "Pec deck", "Pull-up"]);
        exercises[0].GroupId.ShouldBe(groups[0].Id.Value);
        exercises[0].GroupName.ShouldBe(groups[0].Name);
        exercises[0].BestSet.ShouldBeNull();
    }

    [Theory]
    [InlineData("press")]
    [InlineData("PRESS")]
    [InlineData("ch pr")]
    public async Task SearchFindsPartOfTheNameInAnyCase(string search)
    {
        IReadOnlyList<Group> groups = await SaveGroupsAsync(_userId);
        await SaveExerciseAsync("Bench Press", groups[0]);
        await SaveExerciseAsync("Pec deck", groups[0]);

        List<ExerciseListItemResponse> exercises = await ListAsync(search);

        exercises.ShouldHaveSingleItem().Name.ShouldBe("Bench Press");
    }

    [Fact]
    public async Task AGroupNarrowsTheList()
    {
        IReadOnlyList<Group> groups = await SaveGroupsAsync(_userId);
        await SaveExerciseAsync("Bench press", groups[0]);
        await SaveExerciseAsync("Pull-up", groups[1]);

        List<ExerciseListItemResponse> exercises = await ListAsync(groupId: groups[1].Id);

        exercises.ShouldHaveSingleItem().Name.ShouldBe("Pull-up");
    }

    [Fact]
    public async Task DeletedExercisesAndOtherUsersExercisesAreLeftOut()
    {
        IReadOnlyList<Group> groups = await SaveGroupsAsync(_userId);
        Exercise deleted = await SaveExerciseAsync("Bench press", groups[0]);
        await MarkDeletedAsync(deleted);
        IReadOnlyList<Group> otherGroups = await SaveGroupsAsync(UserId.From(Guid.CreateVersion7()));
        _dbContext.Exercises.Add(Exercise.Create(otherGroups[0].UserId, "Pec deck", otherGroups[0].Id, []));
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        (await ListAsync()).ShouldBeEmpty();
    }

    [Fact]
    public async Task AnExerciseComesWithItsGroupAndAlsoWorksGroupsInOrder()
    {
        IReadOnlyList<Group> groups = await SaveGroupsAsync(_userId);
        Exercise saved = await SaveExerciseAsync("Bench press", groups[0], groups[2].Id, groups[1].Id);

        ExerciseDetailsResponse? exercise = await GetAsync(saved.Id);

        exercise.ShouldNotBeNull().Name.ShouldBe("Bench press");
        exercise.Group.ShouldBe(new GroupResponse(groups[0].Id.Value, groups[0].Name));
        exercise.AlsoWorksGroups.Select(group => group.Id).ShouldBe([groups[1].Id.Value, groups[2].Id.Value]);
    }

    [Fact]
    public async Task AnUnknownExerciseReadsAsNull()
    {
        (await GetAsync(ExerciseId.New())).ShouldBeNull();
    }

    [Fact]
    public async Task ADeletedExerciseReadsAsNull()
    {
        IReadOnlyList<Group> groups = await SaveGroupsAsync(_userId);
        Exercise deleted = await SaveExerciseAsync("Bench press", groups[0]);
        await MarkDeletedAsync(deleted);

        (await GetAsync(deleted.Id)).ShouldBeNull();
    }

    [Fact]
    public async Task AnotherUsersExerciseReadsAsNull()
    {
        IReadOnlyList<Group> otherGroups = await SaveGroupsAsync(UserId.From(Guid.CreateVersion7()));
        Exercise other = Exercise.Create(otherGroups[0].UserId, "Pec deck", otherGroups[0].Id, []);
        _dbContext.Exercises.Add(other);
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        (await GetAsync(other.Id)).ShouldBeNull();
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    private Task<List<ExerciseListItemResponse>> ListAsync(string? search = null, GroupId? groupId = null) =>
        new ExerciseReadRepository(_dbContext).ListAsync(search, groupId, TestContext.Current.CancellationToken);

    private Task<ExerciseDetailsResponse?> GetAsync(ExerciseId id) =>
        new ExerciseReadRepository(_dbContext).GetAsync(id, TestContext.Current.CancellationToken);

    private async Task<IReadOnlyList<Group>> SaveGroupsAsync(UserId userId)
    {
        IReadOnlyList<Group> groups = Group.CreateStarting(userId);
        _dbContext.Groups.AddRange(groups);
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        return groups;
    }

    private async Task<Exercise> SaveExerciseAsync(string name, Group group, params GroupId[] alsoWorksGroupIds)
    {
        Exercise exercise = Exercise.Create(_userId, name, group.Id, alsoWorksGroupIds);
        _dbContext.Exercises.Add(exercise);
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);

        return exercise;
    }

    // Deleting comes with its own flows. These reads only need a row that is already deleted.
    private async Task MarkDeletedAsync(object entity)
    {
        _dbContext.Entry(entity).Property("DeletedAtUtc").CurrentValue = DateTimeOffset.UnixEpoch;
        await _dbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
    }
}
