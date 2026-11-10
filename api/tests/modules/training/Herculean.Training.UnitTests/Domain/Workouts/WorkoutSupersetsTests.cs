using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Domain.Workouts;

public sealed class WorkoutSupersetsTests
{
    private static readonly Dictionary<ExerciseId, List<SetValues>> NoLastTime = [];

    private readonly ExerciseId _press = ExerciseId.New();
    private readonly ExerciseId _row = ExerciseId.New();
    private readonly ExerciseId _squat = ExerciseId.New();
    private readonly Workout _workout;

    public WorkoutSupersetsTests()
    {
        _workout = Workout.Start(
            UserId.From(Guid.CreateVersion7()),
            new DateOnly(2026, 11, 11),
            RoutineId.New(),
            "Upper",
            [new RoutineExerciseValues(_press, 2, 8, 10, SupersetWithNext: true), new RoutineExerciseValues(_row, 2, 8, 10), new RoutineExerciseValues(_squat, 2, 5, 5)],
            NoLastTime,
            null);
    }

    private WorkoutExercise Press => Find(_press);

    private WorkoutExercise Row => Find(_row);

    private WorkoutExercise Squat => Find(_squat);

    [Fact]
    public void AStartedWorkoutCopiesTheRoutinesSupersets()
    {
        Press.SupersetWithNext.ShouldBeTrue();
        Row.SupersetWithNext.ShouldBeFalse();
        Squat.SupersetWithNext.ShouldBeFalse();
    }

    [Fact]
    public void ASkippedWorkoutCopiesTheRoutinesSupersets()
    {
        Workout skipped = Workout.Skip(
            UserId.From(Guid.CreateVersion7()),
            new DateOnly(2026, 11, 11),
            RoutineId.New(),
            "Upper",
            [new RoutineExerciseValues(_press, 2, 8, 10, SupersetWithNext: true), new RoutineExerciseValues(_row, 2, 8, 10)]);

        skipped.Exercises.Select(exercise => exercise.SupersetWithNext).ShouldBe([true, false]);
    }

    [Fact]
    public void RemovingTheSecondEndsTheSuperset()
    {
        _workout.RemoveExercise(Row.Id).IsSuccess.ShouldBeTrue();

        Press.SupersetWithNext.ShouldBeFalse();
    }

    [Fact]
    public void PuttingTheSecondBackJoinsThemAgain()
    {
        _workout.RemoveExercise(Row.Id);

        _workout.RestoreExercise(1, new RoutineExerciseValues(_row, 2, 8, 10), [new LoggedSetValues(60, 8, false)], supersetWithPrevious: true)
            .IsSuccess.ShouldBeTrue();

        Press.SupersetWithNext.ShouldBeTrue();
    }

    [Fact]
    public void PuttingTheFirstBackJoinsThemAgain()
    {
        _workout.RemoveExercise(Press.Id);

        _workout.RestoreExercise(0, new RoutineExerciseValues(_press, 2, 8, 10, SupersetWithNext: true), [new LoggedSetValues(80, 8, false)]);

        Press.SupersetWithNext.ShouldBeTrue();
    }

    [Fact]
    public void ReorderingAPairTogetherKeepsIt()
    {
        _workout.ReorderExercises([Squat.Id, Press.Id, Row.Id]).IsSuccess.ShouldBeTrue();

        Press.SupersetWithNext.ShouldBeTrue();
    }

    [Fact]
    public void ReorderingThatSplitsAPairEndsIt()
    {
        _workout.ReorderExercises([Press.Id, Squat.Id, Row.Id]).IsSuccess.ShouldBeTrue();

        Press.SupersetWithNext.ShouldBeFalse();
    }

    [Fact]
    public void ASwapKeepsTheSuperset()
    {
        _workout.SwapExercise(Row.Id, ExerciseId.New(), []).IsSuccess.ShouldBeTrue();

        Press.SupersetWithNext.ShouldBeTrue();
    }

    [Fact]
    public void FinishingWithoutTheSecondEndsTheSuperset()
    {
        _workout.UpdateSet(Press.Id, Press.Sets[0].Id, null, null, true);
        _workout.UpdateSet(Squat.Id, Squat.Sets[0].Id, null, null, true);

        _workout.Finish(DateTimeOffset.UtcNow).IsSuccess.ShouldBeTrue();

        Press.SupersetWithNext.ShouldBeFalse();
    }

    [Fact]
    public void FinishingWithBothKeepsTheSuperset()
    {
        _workout.UpdateSet(Press.Id, Press.Sets[0].Id, null, null, true);
        _workout.UpdateSet(Row.Id, Row.Sets[0].Id, null, null, true);

        _workout.Finish(DateTimeOffset.UtcNow);

        Press.SupersetWithNext.ShouldBeTrue();
    }

    [Fact]
    public void EditingAwayTheSecondEndsTheSuperset()
    {
        _workout.UpdateSet(Press.Id, Press.Sets[0].Id, null, null, true);
        _workout.UpdateSet(Row.Id, Row.Sets[0].Id, null, null, true);
        _workout.Finish(DateTimeOffset.UtcNow);

        _workout.Edit([new EditedExercise(Press.Id, _press, [new SetValues(80, 8)])]).IsSuccess.ShouldBeTrue();

        Press.SupersetWithNext.ShouldBeFalse();
    }

    [Fact]
    public void AnExerciseCanBePairedWithTheNextAndUnpaired()
    {
        _workout.ChangeSuperset(Row.Id, true).IsSuccess.ShouldBeFalse();
        _workout.ChangeSuperset(Press.Id, false).IsSuccess.ShouldBeTrue();

        _workout.ChangeSuperset(Row.Id, true).IsSuccess.ShouldBeTrue();

        Row.SupersetWithNext.ShouldBeTrue();
        Press.SupersetWithNext.ShouldBeFalse();
    }

    [Fact]
    public void ASupersetIsTwoExercisesNextToEachOther()
    {
        _workout.ChangeSuperset(Squat.Id, true).Error.ShouldBe(WorkoutErrors.SupersetNotTwo);
        _workout.ChangeSuperset(Row.Id, true).Error.ShouldBe(WorkoutErrors.SupersetNotTwo);
        Row.SupersetWithNext.ShouldBeFalse();
    }

    [Fact]
    public void TwoAddedExercisesCanBeASuperset()
    {
        ExerciseId curl = ExerciseId.New();
        ExerciseId pushdown = ExerciseId.New();

        _workout.AddExercises([curl, pushdown], NoLastTime, asSuperset: true).IsSuccess.ShouldBeTrue();

        Find(curl).SupersetWithNext.ShouldBeTrue();
        Find(pushdown).SupersetWithNext.ShouldBeFalse();
        _workout.AddExercises([ExerciseId.New()], NoLastTime, asSuperset: true).Error.ShouldBe(WorkoutErrors.SupersetNotTwo);
    }

    [Fact]
    public void EditingSetsTheSupersetsItIsGiven()
    {
        _workout.UpdateSet(Press.Id, Press.Sets[0].Id, null, null, true);
        _workout.UpdateSet(Row.Id, Row.Sets[0].Id, null, null, true);
        _workout.UpdateSet(Squat.Id, Squat.Sets[0].Id, null, null, true);
        _workout.Finish(DateTimeOffset.UtcNow);

        _workout.Edit([
            new EditedExercise(Press.Id, _press, [new SetValues(80, 8)]),
            new EditedExercise(Row.Id, _row, [new SetValues(60, 8)], SupersetWithNext: true),
            new EditedExercise(Squat.Id, _squat, [new SetValues(100, 5)]),
        ]).IsSuccess.ShouldBeTrue();

        Press.SupersetWithNext.ShouldBeFalse();
        Row.SupersetWithNext.ShouldBeTrue();
    }

    [Fact]
    public void EditingRefusesASupersetOnTheLastExercise()
    {
        _workout.UpdateSet(Press.Id, Press.Sets[0].Id, null, null, true);
        _workout.Finish(DateTimeOffset.UtcNow);

        _workout.Edit([new EditedExercise(Press.Id, _press, [new SetValues(80, 8)], SupersetWithNext: true)])
            .Error.ShouldBe(WorkoutErrors.SupersetNotTwo);
    }

    private WorkoutExercise Find(ExerciseId exerciseId) => _workout.Exercises.Single(exercise => exercise.ExerciseId == exerciseId);
}
