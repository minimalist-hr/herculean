using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Days;
using Herculean.Training.Application.Exercises;
using Herculean.Training.Application.Exercises.GetExercise;
using Herculean.Training.Application.Exercises.ListExercises;
using Herculean.Training.Application.Groups.GetGroup;
using Herculean.Training.Application.Workouts;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;
using Herculean.Training.Infrastructure;
using Herculean.Training.Infrastructure.Days;
using Herculean.Training.Infrastructure.Exercises;
using Herculean.Training.Infrastructure.Groups;
using Herculean.Training.Infrastructure.Workouts;
using Herculean.Training.UnitTests.Application;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.UnitTests.Infrastructure;

public sealed class WorkoutTotalsReadTests : IDisposable
{
    private static readonly DateOnly Date = new(2026, 11, 2);
    private static readonly DateTimeOffset Now = new(2026, 11, 2, 18, 0, 0, TimeSpan.Zero);

    private readonly UserId _userId = UserId.From(Guid.CreateVersion7());
    private readonly TrainingDbContext _dbContext;

    public WorkoutTotalsReadTests()
    {
        _dbContext = new TrainingDbContext(
            new DbContextOptionsBuilder<TrainingDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
            new CurrentUser(new FakeCurrentUserAccessor { UserId = _userId.Value }));
    }

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    private async Task<Exercise> SaveExerciseAsync()
    {
        Group group = Group.CreateStarting(_userId)[0];
        _dbContext.Groups.Add(group);
        Exercise exercise = Exercise.Create(_userId, $"Squat {Guid.NewGuid()}", group.Id, []);
        _dbContext.Exercises.Add(exercise);
        await _dbContext.SaveChangesAsync(Token);

        return exercise;
    }

    /// <summary>A workout of one exercise with three target sets, of which these are logged and checked.</summary>
    private async Task<Workout> SaveWorkoutAsync(Exercise exercise, DateOnly date, bool finish, params (decimal WeightKg, int Reps)[] sets)
    {
        Workout workout = Workout.Start(
            _userId,
            date,
            RoutineId.New(),
            "Legs",
            [new RoutineExerciseValues(exercise.Id, 3, 8, 10)],
            new Dictionary<ExerciseId, List<SetValues>>(),
            Now.AddHours(-1));
        WorkoutExercise logged = workout.Exercises[0];
        foreach ((Set set, (decimal weightKg, int reps)) in logged.Sets.Zip(sets))
        {
            workout.UpdateSet(logged.Id, set.Id, weightKg, reps, true);
        }

        if (finish)
        {
            workout.Finish(Now);
        }

        _dbContext.Workouts.Add(workout);
        await _dbContext.SaveChangesAsync(Token);

        return workout;
    }

    private Task<List<DoneWorkoutTotals>> ListDoneAsync() =>
        new DayReadRepository(_dbContext).ListDoneWorkoutTotalsAsync(Date, Date.AddDays(27), Token);

    private Task<List<EarlierMostReps>> ListEarlierAsync(Exercise exercise, DateOnly before) =>
        new WorkoutReadRepository(_dbContext).ListEarlierMostRepsAsync([exercise.Id], before, Token);

    [Fact]
    public async Task ACompletedWorkoutAddsItsCheckedSetsAndVolume()
    {
        Exercise exercise = await SaveExerciseAsync();
        await SaveWorkoutAsync(exercise, Date, finish: true, (100, 5), (90, 10));

        DoneWorkoutTotals totals = (await ListDoneAsync()).ShouldHaveSingleItem();

        totals.Date.ShouldBe(Date);
        totals.StartedAtUtc.ShouldBe(Now.AddHours(-1));
        totals.FinishedAtUtc.ShouldBe(Now);
        totals.TargetSets.ShouldBe(3);
        totals.SetsDone.ShouldBe(2);
        totals.VolumeKg.ShouldBe(1400);
    }

    [Fact]
    public async Task AWorkoutInProgressAddsNothing()
    {
        Exercise exercise = await SaveExerciseAsync();
        await SaveWorkoutAsync(exercise, Date, finish: false, (100, 5));

        (await ListDoneAsync()).ShouldBeEmpty();
    }

    [Fact]
    public async Task EarlierMostRepsAreTheBestAtEachWeightOnEarlierDates()
    {
        Exercise exercise = await SaveExerciseAsync();
        await SaveWorkoutAsync(exercise, Date.AddDays(-7), finish: true, (100, 5), (90, 8));
        await SaveWorkoutAsync(exercise, Date.AddDays(-3), finish: true, (100, 7));
        await SaveWorkoutAsync(exercise, Date, finish: true, (100, 12));

        List<EarlierMostReps> earlier = await ListEarlierAsync(exercise, Date);

        earlier.OrderBy(best => best.WeightKg).Select(best => (best.WeightKg, best.Reps)).ShouldBe([(90m, 8), (100m, 7)]);
    }

    [Fact]
    public async Task AWorkoutInProgressIsNotEarlier()
    {
        Exercise exercise = await SaveExerciseAsync();
        await SaveWorkoutAsync(exercise, Date.AddDays(-7), finish: false, (100, 5));

        (await ListEarlierAsync(exercise, Date)).ShouldBeEmpty();
    }

    [Fact]
    public async Task AnExerciseHasItsBestSetTimesDoneAndFirstDate()
    {
        Exercise exercise = await SaveExerciseAsync();
        await SaveWorkoutAsync(exercise, Date.AddDays(-14), finish: true, (80, 10));
        await SaveWorkoutAsync(exercise, Date.AddDays(-7), finish: true, (100, 5), (100, 8));
        await SaveWorkoutAsync(exercise, Date, finish: true, (100, 8), (90, 12));

        ExerciseDetailsResponse read = (await new ExerciseReadRepository(_dbContext).GetAsync(exercise.Id, Token)).ShouldNotBeNull();

        read.BestSet.ShouldBe(new BestSetResponse(100, 8, Date.AddDays(-7)));
        read.TimesDone.ShouldBe(3);
        read.FirstDoneOn.ShouldBe(Date.AddDays(-14));
    }

    [Fact]
    public async Task UncheckedSetsAndWorkoutsInProgressDontCount()
    {
        Exercise exercise = await SaveExerciseAsync();
        await SaveWorkoutAsync(exercise, Date.AddDays(-7), finish: false, (100, 5));
        await SaveWorkoutAsync(exercise, Date, finish: true);

        ExerciseDetailsResponse read = (await new ExerciseReadRepository(_dbContext).GetAsync(exercise.Id, Token)).ShouldNotBeNull();

        read.BestSet.ShouldBeNull();
        read.TimesDone.ShouldBe(0);
        read.FirstDoneOn.ShouldBeNull();
    }

    [Fact]
    public async Task ListedExercisesAndAGroupsExercisesHaveTheirBestSets()
    {
        Exercise done = await SaveExerciseAsync();
        Exercise notDone = await SaveExerciseAsync();
        await SaveWorkoutAsync(done, Date, finish: true, (60, 10));

        List<ExerciseListItemResponse> listed = await new ExerciseReadRepository(_dbContext).ListAsync(null, null, Token);
        GroupDetailsResponse group = (await new GroupReadRepository(_dbContext).GetAsync(done.GroupId, Token)).ShouldNotBeNull();

        listed.Single(exercise => exercise.Id == done.Id.Value).BestSet.ShouldBe(new BestSetResponse(60, 10, Date));
        listed.Single(exercise => exercise.Id == notDone.Id.Value).BestSet.ShouldBeNull();
        group.Exercises.ShouldHaveSingleItem().BestSet.ShouldBe(new BestSetResponse(60, 10, Date));
    }

    [Fact]
    public async Task OnlyADeletedWorkoutCanBeFoundToRestore()
    {
        Exercise exercise = await SaveExerciseAsync();
        Workout workout = await SaveWorkoutAsync(exercise, Date, finish: false);
        WorkoutRepository repository = new(_dbContext);

        (await repository.GetDeletedAsync(workout.Id, Token)).ShouldBeNull();

        workout.Delete(Now);
        await _dbContext.SaveChangesAsync(Token);

        (await repository.GetDeletedAsync(workout.Id, Token)).ShouldBe(workout);
    }

    public void Dispose()
    {
        _dbContext.Dispose();
    }
}
