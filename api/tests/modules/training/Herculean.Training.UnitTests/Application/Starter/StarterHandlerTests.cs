using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Starter;
using Herculean.Training.Application.Starter.CreateStarterExercise;
using Herculean.Training.Application.Starter.CreateStarterGroup;
using Herculean.Training.Application.Starter.DeleteStarterExercise;
using Herculean.Training.Application.Starter.DeleteStarterGroup;
using Herculean.Training.Application.Starter.ListStarterExercises;
using Herculean.Training.Application.Starter.ListStarterGroups;
using Herculean.Training.Application.Starter.RenameStarterGroup;
using Herculean.Training.Application.Starter.UpdateStarterExercise;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Starter;
using Herculean.Training.Infrastructure;
using Herculean.Training.Infrastructure.Starter;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.UnitTests.Application.Starter;

/// <summary>Starter groups and exercises, created, listed, changed and deleted against one database.</summary>
public abstract class StarterHandlerTests : IDisposable
{
    internal TrainingDbContext DbContext { get; } = new(
        new DbContextOptionsBuilder<TrainingDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
        new CurrentUser(new FakeCurrentUserAccessor()));

    internal static CancellationToken Token => TestContext.Current.CancellationToken;

    internal StarterGroupRepository Groups => new(DbContext);

    internal StarterExerciseRepository Exercises => new(DbContext);

    internal CreateStarterGroupHandler CreateGroup => new(new SaveStarterGroupValidator(), Groups, DbContext);

    internal CreateStarterExerciseHandler CreateExercise => new(new SaveStarterExerciseValidator(), Exercises, Groups, DbContext);

    internal ListStarterGroupsHandler ListGroups => new(new StarterReadRepository(DbContext));

    internal ListStarterExercisesHandler ListExercises => new(new StarterReadRepository(DbContext));

    internal async Task<Guid> SaveGroupAsync(string name) =>
        (await CreateGroup.HandleAsync(new SaveStarterGroupRequest(name), Token)).Value.Id;

    internal async Task<Guid> SaveExerciseAsync(string name, Guid groupId, params Guid[] alsoWorks) =>
        (await CreateExercise.HandleAsync(new SaveStarterExerciseRequest(name, groupId, [.. alsoWorks]), Token)).Value.Id;

    internal async Task<List<StarterGroupResponse>> ListAllGroupsAsync()
    {
        DbContext.ChangeTracker.Clear();

        return (await ListGroups.HandleAsync(Token)).Value;
    }

    internal async Task<List<StarterExerciseResponse>> ListAllExercisesAsync()
    {
        DbContext.ChangeTracker.Clear();

        return (await ListExercises.HandleAsync(Token)).Value;
    }

    public void Dispose()
    {
        DbContext.Dispose();
        GC.SuppressFinalize(this);
    }
}

public sealed class CreateStarterGroupHandlerTests : StarterHandlerTests
{
    [Fact]
    public async Task ANewGroupGoesLastTrimmed()
    {
        await SaveGroupAsync("Chest");

        Guid id = await SaveGroupAsync(" Back ");

        (await ListAllGroupsAsync()).Select(group => (group.Name, group.ExerciseCount)).ShouldBe([("Chest", 0), ("Back", 0)]);
        (await Groups.GetAsync(StarterGroupId.From(id), Token)).ShouldNotBeNull().Order.ShouldBe(1);
    }

    [Fact]
    public async Task ANameIsUniqueInAnyCase()
    {
        await SaveGroupAsync("Chest");

        Result<StarterCreatedResponse> result = await CreateGroup.HandleAsync(new SaveStarterGroupRequest("CHEST"), Token);

        result.Error.ShouldBe(StarterErrors.GroupNameTaken);
    }

    [Fact]
    public async Task FiftyIsTheMost()
    {
        for (int index = 0; index < Group.MaxPerUser; index++)
        {
            await SaveGroupAsync($"Group {index}");
        }

        Result<StarterCreatedResponse> result = await CreateGroup.HandleAsync(new SaveStarterGroupRequest("One more"), Token);

        result.Error.ShouldBe(StarterErrors.GroupLimitReached);
    }

    [Fact]
    public async Task AnEmptyNameIsNotValid()
    {
        Result<StarterCreatedResponse> result = await CreateGroup.HandleAsync(new SaveStarterGroupRequest(" "), Token);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("name");
    }
}

public sealed class ListStarterGroupsHandlerTests : StarterHandlerTests
{
    [Fact]
    public async Task EachGroupCountsTheExercisesInIt()
    {
        Guid chest = await SaveGroupAsync("Chest");
        Guid triceps = await SaveGroupAsync("Triceps");
        await SaveExerciseAsync("Bench press", chest, triceps);
        await SaveExerciseAsync("Cable crossover", chest);

        (await ListAllGroupsAsync()).Select(group => (group.Name, group.ExerciseCount)).ShouldBe([("Chest", 2), ("Triceps", 0)]);
    }
}

public sealed class RenameStarterGroupHandlerTests : StarterHandlerTests
{
    private RenameStarterGroupHandler Rename => new(new SaveStarterGroupValidator(), Groups, DbContext);

    [Fact]
    public async Task AGroupIsRenamed()
    {
        Guid id = await SaveGroupAsync("Chest");

        Result result = await Rename.HandleAsync(id, new SaveStarterGroupRequest(" Upper chest "), Token);

        result.IsSuccess.ShouldBeTrue();
        (await ListAllGroupsAsync()).ShouldHaveSingleItem().Name.ShouldBe("Upper chest");
    }

    [Fact]
    public async Task AGroupKeepsItsOwnNameInAnotherCase()
    {
        Guid id = await SaveGroupAsync("Chest");

        (await Rename.HandleAsync(id, new SaveStarterGroupRequest("CHEST"), Token)).IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task AnotherGroupsNameIsTaken()
    {
        await SaveGroupAsync("Chest");
        Guid id = await SaveGroupAsync("Back");

        (await Rename.HandleAsync(id, new SaveStarterGroupRequest("chest"), Token)).Error.ShouldBe(StarterErrors.GroupNameTaken);
    }

    [Fact]
    public async Task AMissingGroupIsNotFound()
    {
        (await Rename.HandleAsync(Guid.CreateVersion7(), new SaveStarterGroupRequest("Chest"), Token)).Error.ShouldBe(StarterErrors.GroupNotFound);
    }

    [Fact]
    public async Task AnEmptyNameIsNotValid()
    {
        Guid id = await SaveGroupAsync("Chest");

        (await Rename.HandleAsync(id, new SaveStarterGroupRequest(""), Token)).Error.ShouldNotBeNull().Fields.ShouldContainKey("name");
    }
}

public sealed class DeleteStarterGroupHandlerTests : StarterHandlerTests
{
    private DeleteStarterGroupHandler Delete => new(Groups, DbContext);

    [Fact]
    public async Task AnUnusedGroupIsDeleted()
    {
        Guid id = await SaveGroupAsync("Chest");

        (await Delete.HandleAsync(id, Token)).IsSuccess.ShouldBeTrue();

        (await ListAllGroupsAsync()).ShouldBeEmpty();
    }

    [Fact]
    public async Task AGroupWithExercisesStays()
    {
        Guid id = await SaveGroupAsync("Chest");
        await SaveExerciseAsync("Bench press", id);

        (await Delete.HandleAsync(id, Token)).Error.ShouldBe(StarterErrors.GroupInUse);
    }

    [Fact]
    public async Task AGroupAnExerciseAlsoWorksStays()
    {
        Guid chest = await SaveGroupAsync("Chest");
        Guid triceps = await SaveGroupAsync("Triceps");
        await SaveExerciseAsync("Bench press", chest, triceps);

        (await Delete.HandleAsync(triceps, Token)).Error.ShouldBe(StarterErrors.GroupInUse);
    }

    [Fact]
    public async Task AMissingGroupIsNotFound()
    {
        (await Delete.HandleAsync(Guid.CreateVersion7(), Token)).Error.ShouldBe(StarterErrors.GroupNotFound);
    }
}

public sealed class CreateStarterExerciseHandlerTests : StarterHandlerTests
{
    [Fact]
    public async Task AnExerciseIsSavedTrimmedWithItsGroups()
    {
        Guid chest = await SaveGroupAsync("Chest");
        Guid triceps = await SaveGroupAsync("Triceps");

        Guid id = await SaveExerciseAsync(" Bench press ", chest, triceps);

        (await ListAllExercisesAsync()).ShouldHaveSingleItem().ShouldBeEquivalentTo(new StarterExerciseResponse(id, "Bench press", chest, [triceps]));
    }

    [Fact]
    public async Task ANameIsUniqueInAnyCase()
    {
        Guid chest = await SaveGroupAsync("Chest");
        await SaveExerciseAsync("Bench press", chest);

        Result<StarterCreatedResponse> result = await CreateExercise.HandleAsync(new SaveStarterExerciseRequest("BENCH PRESS", chest, null), Token);

        result.Error.ShouldBe(StarterErrors.ExerciseNameTaken);
    }

    [Fact]
    public async Task AMissingGroupIsNotFound()
    {
        Guid chest = await SaveGroupAsync("Chest");

        Result<StarterCreatedResponse> result = await CreateExercise.HandleAsync(new SaveStarterExerciseRequest("Bench press", chest, [Guid.CreateVersion7()]), Token);

        result.Error.ShouldBe(StarterErrors.GroupNotFound);
    }

    [Fact]
    public async Task FiveHundredIsTheMost()
    {
        Guid chest = await SaveGroupAsync("Chest");
        for (int index = 0; index < Exercise.MaxPerUser; index++)
        {
            DbContext.StarterExercises.Add(StarterExercise.Create($"Exercise {index}", StarterGroupId.From(chest), []));
        }

        await DbContext.SaveChangesAsync(Token);

        Result<StarterCreatedResponse> result = await CreateExercise.HandleAsync(new SaveStarterExerciseRequest("One more", chest, null), Token);

        result.Error.ShouldBe(StarterErrors.ExerciseLimitReached);
    }

    [Fact]
    public async Task AlsoWorksCantIncludeItsOwnGroup()
    {
        Guid chest = await SaveGroupAsync("Chest");

        Result<StarterCreatedResponse> result = await CreateExercise.HandleAsync(new SaveStarterExerciseRequest("Bench press", chest, [chest]), Token);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("alsoWorksGroupIds");
    }
}

public sealed class ListStarterExercisesHandlerTests : StarterHandlerTests
{
    [Fact]
    public async Task NoExercisesListNone()
    {
        (await ListAllExercisesAsync()).ShouldBeEmpty();
    }
}

public sealed class UpdateStarterExerciseHandlerTests : StarterHandlerTests
{
    private UpdateStarterExerciseHandler Update => new(new SaveStarterExerciseValidator(), Exercises, Groups, DbContext);

    [Fact]
    public async Task AnExerciseChangesItsNameAndGroups()
    {
        Guid chest = await SaveGroupAsync("Chest");
        Guid triceps = await SaveGroupAsync("Triceps");
        Guid id = await SaveExerciseAsync("Bench press", chest, triceps);
        DbContext.ChangeTracker.Clear();

        Result result = await Update.HandleAsync(id, new SaveStarterExerciseRequest("Dips", triceps, [chest]), Token);

        result.IsSuccess.ShouldBeTrue();
        (await ListAllExercisesAsync()).ShouldHaveSingleItem().ShouldBeEquivalentTo(new StarterExerciseResponse(id, "Dips", triceps, [chest]));
    }

    [Fact]
    public async Task AnotherExercisesNameIsTaken()
    {
        Guid chest = await SaveGroupAsync("Chest");
        await SaveExerciseAsync("Bench press", chest);
        Guid id = await SaveExerciseAsync("Dips", chest);

        (await Update.HandleAsync(id, new SaveStarterExerciseRequest("bench press", chest, null), Token)).Error.ShouldBe(StarterErrors.ExerciseNameTaken);
    }

    [Fact]
    public async Task AMissingGroupIsNotFound()
    {
        Guid chest = await SaveGroupAsync("Chest");
        Guid id = await SaveExerciseAsync("Bench press", chest);

        (await Update.HandleAsync(id, new SaveStarterExerciseRequest("Bench press", Guid.CreateVersion7(), null), Token)).Error.ShouldBe(StarterErrors.GroupNotFound);
    }

    [Fact]
    public async Task AMissingExerciseIsNotFound()
    {
        Guid chest = await SaveGroupAsync("Chest");

        (await Update.HandleAsync(Guid.CreateVersion7(), new SaveStarterExerciseRequest("Bench press", chest, null), Token)).Error.ShouldBe(StarterErrors.ExerciseNotFound);
    }

    [Fact]
    public async Task AnEmptyNameIsNotValid()
    {
        Guid chest = await SaveGroupAsync("Chest");
        Guid id = await SaveExerciseAsync("Bench press", chest);

        (await Update.HandleAsync(id, new SaveStarterExerciseRequest(" ", chest, null), Token)).Error.ShouldNotBeNull().Fields.ShouldContainKey("name");
    }
}

public sealed class DeleteStarterExerciseHandlerTests : StarterHandlerTests
{
    private DeleteStarterExerciseHandler Delete => new(Exercises, DbContext);

    [Fact]
    public async Task AnExerciseIsDeletedAndItsGroupIsFree()
    {
        Guid chest = await SaveGroupAsync("Chest");
        Guid triceps = await SaveGroupAsync("Triceps");
        Guid id = await SaveExerciseAsync("Bench press", chest, triceps);

        (await Delete.HandleAsync(id, Token)).IsSuccess.ShouldBeTrue();

        (await ListAllExercisesAsync()).ShouldBeEmpty();
        (await Groups.IsInUseAsync(StarterGroupId.From(triceps), Token)).ShouldBeFalse();
    }

    [Fact]
    public async Task AMissingExerciseIsNotFound()
    {
        (await Delete.HandleAsync(Guid.CreateVersion7(), Token)).Error.ShouldBe(StarterErrors.ExerciseNotFound);
    }
}
