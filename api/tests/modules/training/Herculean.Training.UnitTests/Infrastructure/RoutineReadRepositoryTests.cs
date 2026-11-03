using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Exercises.GetExercise;
using Herculean.Training.Application.Routines.GetRoutine;
using Herculean.Training.Application.Routines.ListRoutines;
using Herculean.Training.Application.WeekPlan.ListWeekPlanDays;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Infrastructure;
using Herculean.Training.Infrastructure.Exercises;
using Herculean.Training.Infrastructure.Routines;
using Herculean.Training.Infrastructure.WeekPlan;
using Herculean.Training.UnitTests.Application;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.UnitTests.Infrastructure;

public sealed class RoutineReadRepositoryTests : IDisposable
{
    private readonly UserId _userId = UserId.From(Guid.CreateVersion7());
    private readonly TrainingDbContext _dbContext;

    public RoutineReadRepositoryTests()
    {
        _dbContext = new TrainingDbContext(
            new DbContextOptionsBuilder<TrainingDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
            new CurrentUser(new FakeCurrentUserAccessor { UserId = _userId.Value }));
    }

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    [Fact]
    public async Task ARoutineCountsItsExercisesAndSets()
    {
        await SaveRoutineAsync("Legs", (3, 8, 10), (4, 5, 5));

        RoutineListItemResponse routine = (await ListRoutinesAsync()).ShouldHaveSingleItem();

        routine.Name.ShouldBe("Legs");
        routine.ExerciseCount.ShouldBe(2);
        routine.SetCount.ShouldBe(7);
        routine.Weekdays.ShouldBeEmpty();
    }

    [Fact]
    public async Task ARoutineWithNoExercisesCountsZero()
    {
        await SaveRoutineAsync("Legs");

        RoutineListItemResponse routine = (await ListRoutinesAsync()).ShouldHaveSingleItem();

        routine.ExerciseCount.ShouldBe(0);
        routine.SetCount.ShouldBe(0);
    }

    [Fact]
    public async Task RoutinesComeByTheirFirstPlannedDayThenUnplannedByName()
    {
        Routine friday = await SaveRoutineAsync("A on Friday");
        Routine monday = await SaveRoutineAsync("Z on Monday");
        await SaveRoutineAsync("Y unplanned");
        await SaveRoutineAsync("X unplanned");
        await SaveDayAsync(Weekday.Friday, friday, new DateOnly(2026, 1, 1));
        await SaveDayAsync(Weekday.Monday, monday, new DateOnly(2026, 1, 1));

        List<RoutineListItemResponse> routines = await ListRoutinesAsync();

        routines.Select(routine => routine.Name).ShouldBe(["Z on Monday", "A on Friday", "X unplanned", "Y unplanned"]);
    }

    [Fact]
    public async Task ARoutineListsTheWeekdaysItIsPlannedOnNow()
    {
        Routine routine = await SaveRoutineAsync("Legs");
        await SaveDayAsync(Weekday.Friday, routine, new DateOnly(2026, 1, 1));
        await SaveDayAsync(Weekday.Monday, routine, new DateOnly(2026, 1, 1));
        await SaveDayAsync(Weekday.Tuesday, routine, new DateOnly(2026, 1, 1));
        await SaveDayAsync(Weekday.Tuesday, null, new DateOnly(2026, 2, 1));

        (await ListRoutinesAsync()).ShouldHaveSingleItem().Weekdays.ShouldBe([Weekday.Monday, Weekday.Friday]);
    }

    [Fact]
    public async Task DeletedRoutinesAndOtherUsersAreLeftOut()
    {
        Routine deleted = await SaveRoutineAsync("Legs");
        _dbContext.Entry(deleted).Property(routine => routine.DeletedAtUtc).CurrentValue = DateTimeOffset.UnixEpoch;
        _dbContext.Routines.Add(Routine.Create(UserId.From(Guid.CreateVersion7()), "Back", []));
        await _dbContext.SaveChangesAsync(Token);

        (await ListRoutinesAsync()).ShouldBeEmpty();
    }

    [Fact]
    public async Task TheWeekPlanHasEveryDayFromMonday()
    {
        List<WeekPlanDayResponse> days = await ListDaysAsync();

        days.Select(day => day.Weekday).ShouldBe([Weekday.Monday, Weekday.Tuesday, Weekday.Wednesday, Weekday.Thursday, Weekday.Friday, Weekday.Saturday, Weekday.Sunday]);
        days.ShouldAllBe(day => day.RoutineId == null && day.RoutineName == null);
    }

    [Fact]
    public async Task EachDayShowsItsLatestChange()
    {
        Routine first = await SaveRoutineAsync("First");
        Routine second = await SaveRoutineAsync("Second");
        await SaveDayAsync(Weekday.Monday, second, new DateOnly(2026, 2, 1));
        await SaveDayAsync(Weekday.Monday, first, new DateOnly(2026, 1, 1));
        await SaveDayAsync(Weekday.Tuesday, first, new DateOnly(2026, 1, 1));
        await SaveDayAsync(Weekday.Tuesday, null, new DateOnly(2026, 2, 1));

        List<WeekPlanDayResponse> days = await ListDaysAsync();

        days[0].RoutineId.ShouldBe(second.Id.Value);
        days[0].RoutineName.ShouldBe("Second");
        days[1].RoutineId.ShouldBeNull();
    }

    [Fact]
    public async Task ADayOnADeletedRoutineIsARestDay()
    {
        Routine routine = await SaveRoutineAsync("Legs");
        await SaveDayAsync(Weekday.Monday, routine, new DateOnly(2026, 1, 1));
        _dbContext.Entry(routine).Property(item => item.DeletedAtUtc).CurrentValue = DateTimeOffset.UnixEpoch;
        await _dbContext.SaveChangesAsync(Token);

        (await ListDaysAsync())[0].RoutineId.ShouldBeNull();
    }

    [Fact]
    public async Task AnotherUsersPlanIsLeftOut()
    {
        _dbContext.WeekPlanDays.Add(WeekPlanDay.Create(UserId.From(Guid.CreateVersion7()), Weekday.Monday, RoutineId.New(), new DateOnly(2026, 1, 1)));
        await _dbContext.SaveChangesAsync(Token);

        (await ListDaysAsync())[0].RoutineId.ShouldBeNull();
    }

    [Fact]
    public async Task ARoutineComesWithItsDaysAndExercisesInOrder()
    {
        Routine routine = await SaveRoutineAsync("Legs", (3, 8, 10), (4, 5, 5));
        await SaveDayAsync(Weekday.Thursday, routine, new DateOnly(2026, 1, 1));
        await SaveDayAsync(Weekday.Monday, routine, new DateOnly(2026, 1, 1));

        RoutineDetailsResponse details = (await new RoutineReadRepository(_dbContext).GetAsync(routine.Id, Token)).ShouldNotBeNull();

        details.Name.ShouldBe("Legs");
        details.Weekdays.ShouldBe([Weekday.Monday, Weekday.Thursday]);
        details.Exercises.Select(exercise => exercise.TargetSets).ShouldBe([3, 4]);
        details.Exercises[0].Name.ShouldStartWith("Legs");
        details.Exercises[1].TargetRepsTo.ShouldBe(5);
    }

    [Fact]
    public async Task AnUnknownRoutineIsNull()
    {
        (await new RoutineReadRepository(_dbContext).GetAsync(RoutineId.New(), Token)).ShouldBeNull();
    }

    [Fact]
    public async Task AChangedRoutineSavesItsNewExercisesAndDropsTheOldOnes()
    {
        Routine saved = await SaveRoutineAsync("Legs", (3, 8, 10), (4, 5, 5));
        ExerciseId kept = saved.Exercises[1].ExerciseId;
        RoutineRepository repository = new(_dbContext);
        Routine routine = (await repository.GetAsync(saved.Id, Token)).ShouldNotBeNull();
        Routine donor = await SaveRoutineAsync("Donor", (1, 1, 1));

        routine.Update("Legs", [new RoutineExerciseValues(donor.Exercises[0].ExerciseId, 2, 6, 6), new RoutineExerciseValues(kept, 4, 5, 5)]);
        await _dbContext.SaveChangesAsync(Token);

        RoutineDetailsResponse details = (await new RoutineReadRepository(_dbContext).GetAsync(saved.Id, Token)).ShouldNotBeNull();
        details.Exercises.Select(exercise => exercise.ExerciseId).ShouldBe([donor.Exercises[0].ExerciseId.Value, kept.Value]);
    }

    [Fact]
    public async Task AnExerciseListsItsRoutinesByName()
    {
        Routine legs = await SaveRoutineAsync("Legs", (3, 8, 10));
        Routine arms = await SaveRoutineAsync("Arms", (3, 8, 10));
        RoutineRepository repository = new(_dbContext);
        ExerciseId exerciseId = legs.Exercises[0].ExerciseId;
        arms.Update("Arms", [new RoutineExerciseValues(arms.Exercises[0].ExerciseId, 3, 8, 10), new RoutineExerciseValues(exerciseId, 3, 8, 10)]);
        await _dbContext.SaveChangesAsync(Token);

        (await repository.UsesExerciseAsync(exerciseId, Token)).ShouldBeTrue();
        ExerciseDetailsResponse details = (await new ExerciseReadRepository(_dbContext).GetAsync(exerciseId, Token)).ShouldNotBeNull();
        details.Routines.Select(routine => routine.Name).ShouldBe(["Arms", "Legs"]);
    }

    [Fact]
    public async Task ADeletedRoutineDoesNotHoldItsExerciseAndCanBeFound()
    {
        Routine legs = await SaveRoutineAsync("Legs", (3, 8, 10));
        ExerciseId exerciseId = legs.Exercises[0].ExerciseId;
        RoutineRepository repository = new(_dbContext);
        legs.Delete(DateTimeOffset.UnixEpoch);
        await _dbContext.SaveChangesAsync(Token);
        _dbContext.ChangeTracker.Clear();

        (await repository.UsesExerciseAsync(exerciseId, Token)).ShouldBeFalse();
        (await repository.GetAsync(legs.Id, Token)).ShouldBeNull();
        Routine deleted = (await repository.GetDeletedAsync(legs.Id, Token)).ShouldNotBeNull();
        deleted.Exercises.ShouldHaveSingleItem();
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }

    private Task<List<RoutineListItemResponse>> ListRoutinesAsync() =>
        new RoutineReadRepository(_dbContext).ListAsync(Token);

    private Task<List<WeekPlanDayResponse>> ListDaysAsync() =>
        new WeekPlanReadRepository(_dbContext).ListAsync(Token);

    private async Task<Routine> SaveRoutineAsync(string name, params (int Sets, int From, int To)[] targets)
    {
        Group group = Group.CreateStarting(_userId)[0];
        _dbContext.Groups.Add(group);
        List<RoutineExerciseValues> values = [];
        foreach ((int sets, int from, int to) in targets)
        {
            Exercise exercise = Exercise.Create(_userId, $"{name} {Guid.NewGuid()}", group.Id, []);
            _dbContext.Exercises.Add(exercise);
            values.Add(new RoutineExerciseValues(exercise.Id, sets, from, to));
        }

        Routine routine = Routine.Create(_userId, name, values);
        _dbContext.Routines.Add(routine);
        await _dbContext.SaveChangesAsync(Token);

        return routine;
    }

    private async Task SaveDayAsync(Weekday weekday, Routine? routine, DateOnly effectiveFrom)
    {
        _dbContext.WeekPlanDays.Add(WeekPlanDay.Create(_userId, weekday, routine?.Id, effectiveFrom));
        await _dbContext.SaveChangesAsync(Token);
    }
}
