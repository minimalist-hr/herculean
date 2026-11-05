using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Domain.Workouts;

public sealed class WorkoutExercisesTests
{
    private static readonly Dictionary<ExerciseId, List<SetValues>> NoLastTime = [];

    private readonly ExerciseId _squat = ExerciseId.New();
    private readonly ExerciseId _press = ExerciseId.New();
    private readonly Workout _workout;

    public WorkoutExercisesTests()
    {
        _workout = Workout.Start(
            UserId.From(Guid.CreateVersion7()),
            new DateOnly(2026, 11, 3),
            RoutineId.New(),
            "Legs",
            [new RoutineExerciseValues(_squat, 2, 8, 10), new RoutineExerciseValues(_press, 2, 10, 12)],
            NoLastTime,
            null);
    }

    private WorkoutExercise Squat => _workout.Exercises.Single(exercise => exercise.ExerciseId == _squat);

    private WorkoutExercise Press => _workout.Exercises.Single(exercise => exercise.ExerciseId == _press);

    [Fact]
    public void AddedExercisesGoLastAtTheStartingTargets()
    {
        ExerciseId curl = ExerciseId.New();

        _workout.AddExercises([curl], NoLastTime).IsSuccess.ShouldBeTrue();

        WorkoutExercise added = _workout.Exercises.Single(exercise => exercise.ExerciseId == curl);
        added.Order.ShouldBe(2);
        added.TargetSets.ShouldBe(3);
        added.TargetRepsFrom.ShouldBe(8);
        added.TargetRepsTo.ShouldBe(10);
        added.Sets.Select(set => (set.WeightKg, set.Reps)).ShouldBe([(0m, 8), (0m, 8), (0m, 8)]);
    }

    [Fact]
    public void AddedExercisesStartFromLastTime()
    {
        ExerciseId curl = ExerciseId.New();

        _workout.AddExercises([curl], new Dictionary<ExerciseId, List<SetValues>> { [curl] = [new SetValues(20, 12)] });

        _workout.Exercises.Single(exercise => exercise.ExerciseId == curl).Sets.Select(set => (set.WeightKg, set.Reps))
            .ShouldBe([(20m, 12), (20m, 12), (20m, 12)]);
    }

    [Fact]
    public void AnExerciseGoesInOnce()
    {
        _workout.AddExercises([_squat], NoLastTime).Error.ShouldBe(WorkoutErrors.ExerciseAlreadyIn);
    }

    [Fact]
    public void AWorkoutHasAtMost30Exercises()
    {
        List<ExerciseId> many = [.. Enumerable.Range(0, Routine.MaxExercises - 2).Select(_ => ExerciseId.New())];
        _workout.AddExercises(many, NoLastTime).IsSuccess.ShouldBeTrue();

        _workout.AddExercises([ExerciseId.New()], NoLastTime).Error.ShouldBe(WorkoutErrors.TooManyExercises);
    }

    [Fact]
    public void RemovingAnExerciseClosesTheGap()
    {
        _workout.RemoveExercise(Squat.Id).IsSuccess.ShouldBeTrue();

        _workout.Exercises.ShouldHaveSingleItem().ExerciseId.ShouldBe(_press);
        Press.Order.ShouldBe(0);
    }

    [Fact]
    public void TheLastExerciseCanBeRemoved()
    {
        _workout.RemoveExercise(Squat.Id);

        _workout.RemoveExercise(Press.Id).IsSuccess.ShouldBeTrue();

        _workout.Exercises.ShouldBeEmpty();
    }

    [Fact]
    public void ARestoredExerciseGoesBackWithItsSets()
    {
        _workout.RemoveExercise(Squat.Id);

        _workout.RestoreExercise(0, new RoutineExerciseValues(_squat, 2, 8, 10), [new LoggedSetValues(80, 10, true), new LoggedSetValues(82.5m, 8, false)])
            .IsSuccess.ShouldBeTrue();

        Squat.Order.ShouldBe(0);
        Press.Order.ShouldBe(1);
        Squat.Sets.Select(set => (set.Order, set.WeightKg, set.Reps, set.Checked)).ShouldBe([(0, 80m, 10, true), (1, 82.5m, 8, false)]);
    }

    [Fact]
    public void ASwapKeepsTheSetCountAndTargetsAndStartsFromLastTime()
    {
        ExerciseId lunge = ExerciseId.New();
        _workout.UpdateSet(Squat.Id, Squat.Sets[0].Id, 50, null, null);
        WorkoutExercise exercise = Squat;

        _workout.SwapExercise(exercise.Id, lunge, [new SetValues(30, 6)]).IsSuccess.ShouldBeTrue();

        exercise.ExerciseId.ShouldBe(lunge);
        exercise.TargetSets.ShouldBe(2);
        exercise.Sets.Select(set => (set.WeightKg, set.Reps, set.WeightChanged)).ShouldBe([(30m, 6, false), (30m, 6, false)]);
    }

    [Fact]
    public void ASwapWithNoLastTimeStartsAtZeroAndTheLowEnd()
    {
        WorkoutExercise exercise = Squat;

        _workout.SwapExercise(exercise.Id, ExerciseId.New(), []);

        exercise.Sets.Select(set => (set.WeightKg, set.Reps)).ShouldBe([(0m, 8), (0m, 8)]);
    }

    [Fact]
    public void CheckedSetsStopASwap()
    {
        _workout.UpdateSet(Squat.Id, Squat.Sets[0].Id, null, null, true);

        _workout.SwapExercise(Squat.Id, ExerciseId.New(), []).Error.ShouldBe(WorkoutErrors.ExerciseHasCheckedSets);
        _workout.SwapExerciseBack(Squat.Id, ExerciseId.New(), [new SetValues(1, 1)]).Error.ShouldBe(WorkoutErrors.ExerciseHasCheckedSets);
    }

    [Fact]
    public void AnExerciseCanNotBeSwappedToOneAlreadyIn()
    {
        _workout.SwapExercise(Squat.Id, _press, []).Error.ShouldBe(WorkoutErrors.ExerciseAlreadyIn);
    }

    [Fact]
    public void UndoingASwapBringsTheValuesBack()
    {
        ExerciseId lunge = ExerciseId.New();
        WorkoutExercise exercise = Squat;
        _workout.SwapExercise(exercise.Id, lunge, []);

        _workout.SwapExerciseBack(exercise.Id, _squat, [new SetValues(80, 10), new SetValues(82.5m, 8)]).IsSuccess.ShouldBeTrue();

        exercise.ExerciseId.ShouldBe(_squat);
        exercise.Sets.Select(set => (set.WeightKg, set.Reps, set.WeightChanged)).ShouldBe([(80m, 10, true), (82.5m, 8, true)]);
    }

    [Fact]
    public void ReorderingPutsThemInTheNewOrder()
    {
        _workout.ReorderExercises([Press.Id, Squat.Id]).IsSuccess.ShouldBeTrue();

        Press.Order.ShouldBe(0);
        Squat.Order.ShouldBe(1);
    }

    [Fact]
    public void ReorderingHasToNameEachOne()
    {
        _workout.ReorderExercises([Press.Id]).Error.ShouldBe(WorkoutErrors.OrderOutOfDate);
        _workout.ReorderExercises([Press.Id, WorkoutExerciseId.New()]).Error.ShouldBe(WorkoutErrors.OrderOutOfDate);
    }

    [Fact]
    public void OnlyAWorkoutInProgressChanges()
    {
        Workout skipped = Workout.Skip(UserId.From(Guid.CreateVersion7()), new DateOnly(2026, 11, 3), RoutineId.New(), "Legs", [new RoutineExerciseValues(_squat, 2, 8, 10)]);
        WorkoutExerciseId id = skipped.Exercises[0].Id;

        skipped.AddExercises([_press], NoLastTime).Error.ShouldBe(WorkoutErrors.NotInProgress);
        skipped.RemoveExercise(id).Error.ShouldBe(WorkoutErrors.NotInProgress);
        skipped.SwapExercise(id, _press, []).Error.ShouldBe(WorkoutErrors.NotInProgress);
        skipped.ReorderExercises([id]).Error.ShouldBe(WorkoutErrors.NotInProgress);
    }

    [Fact]
    public void AnUnknownExerciseIsNotFound()
    {
        _workout.RemoveExercise(WorkoutExerciseId.New()).Error.ShouldBe(WorkoutErrors.ExerciseNotFound);
        _workout.SwapExercise(WorkoutExerciseId.New(), ExerciseId.New(), []).Error.ShouldBe(WorkoutErrors.ExerciseNotFound);
    }
}
