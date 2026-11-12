using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Export.GetExport;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Domain.Workouts;
using Herculean.Training.Infrastructure;
using Herculean.Training.Infrastructure.Export;
using Herculean.Training.UnitTests.Application;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.UnitTests.Infrastructure;

public sealed class ExportReadTests : IDisposable
{
    private static readonly DateTimeOffset Now = new(2026, 11, 2, 18, 0, 0, TimeSpan.Zero);

    private readonly UserId _userId = UserId.From(Guid.CreateVersion7());
    private readonly TrainingDbContext _dbContext;

    public ExportReadTests()
    {
        _dbContext = new TrainingDbContext(
            new DbContextOptionsBuilder<TrainingDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
            new CurrentUser(new FakeCurrentUserAccessor { UserId = _userId.Value }));
    }

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    public void Dispose() => _dbContext.Dispose();

    [Fact]
    public async Task ExportsExercisesRoutinesAndWorkoutsWithTheirNames()
    {
        IReadOnlyList<Group> groups = TestGroups.Create(_userId);
        _dbContext.Groups.AddRange(groups);
        Exercise squat = Exercise.Create(_userId, "Squat", groups[5].Id, []);
        Exercise lunge = Exercise.Create(_userId, "Lunge", groups[5].Id, [groups[0].Id]);
        _dbContext.Exercises.AddRange(squat, lunge);
        Routine legs = Routine.Create(_userId, "Legs", [new RoutineExerciseValues(squat.Id, 3, 8, 10)]);
        _dbContext.Routines.Add(legs);
        _dbContext.WeekPlanDays.Add(WeekPlanDay.Create(_userId, Weekday.Monday, legs.Id, new DateOnly(2026, 1, 5)));
        Workout workout = Workout.Start(_userId, new DateOnly(2026, 11, 2), legs.Id, "Legs", [new RoutineExerciseValues(lunge.Id, 2, 8, 10)], new Dictionary<ExerciseId, List<SetValues>>(), Now.AddHours(-1));
        WorkoutExercise logged = workout.Exercises[0];
        workout.UpdateSet(logged.Id, logged.Sets[0].Id, 40, 10, true);
        workout.Finish(Now);
        _dbContext.Workouts.Add(workout);
        await _dbContext.SaveChangesAsync(Token);
        lunge.Delete(Now);
        await _dbContext.SaveChangesAsync(Token);

        ExportResponse export = await new ExportReadRepository(_dbContext).GetAsync(Token);

        export.Exercises.ShouldHaveSingleItem().ShouldBe(new ExportedExercise("Squat", "Legs", []), new ExportedExerciseComparer());
        ExportedRoutine routine = export.Routines.ShouldHaveSingleItem();
        routine.Days.ShouldBe([Weekday.Monday]);
        routine.Exercises.ShouldBe([new ExportedRoutineExercise("Squat", 3, 8, 10, SupersetWithNext: false, LengthenedPartials: false)]);
        ExportedWorkout saved = export.Workouts.ShouldHaveSingleItem();
        saved.DurationSeconds.ShouldBe(3600);
        ExportedWorkoutExercise exercise = saved.Exercises.ShouldHaveSingleItem();
        exercise.Name.ShouldBe("Lunge");
        exercise.Group.ShouldBe("Legs");
        exercise.Sets.ShouldBe([new ExportedSet(40, 10, PartialsDone: false)]);
    }

    private sealed class ExportedExerciseComparer : IEqualityComparer<ExportedExercise>
    {
        public bool Equals(ExportedExercise? x, ExportedExercise? y) =>
            x is not null && y is not null && x.Name == y.Name && x.Group == y.Group && x.AlsoWorks.SequenceEqual(y.AlsoWorks);

        public int GetHashCode(ExportedExercise obj) => obj.Name.GetHashCode(StringComparison.Ordinal);
    }
}
