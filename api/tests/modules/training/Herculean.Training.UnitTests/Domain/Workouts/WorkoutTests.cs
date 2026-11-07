using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Domain.Workouts;

public sealed class WorkoutTests
{
    private static readonly DateOnly Date = new(2026, 11, 3);

    private readonly Workout _workout = Workout.Start(
        UserId.From(Guid.CreateVersion7()),
        Date,
        RoutineId.New(),
        "Legs",
        [new RoutineExerciseValues(ExerciseId.New(), 4, 8, 10)],
        new Dictionary<ExerciseId, List<SetValues>>(),
        null);

    private WorkoutExercise Exercise => _workout.Exercises[0];

    private Set SetAt(int order) => Exercise.Sets[order];

    private void Update(int order, decimal? weightKg = null, int? reps = null, bool? isChecked = null)
    {
        _workout.UpdateSet(Exercise.Id, SetAt(order).Id, weightKg, reps, isChecked).IsSuccess.ShouldBeTrue();
    }

    private decimal[] Weights() => [.. Exercise.Sets.Select(set => set.WeightKg)];

    private int[] Reps() => [.. Exercise.Sets.Select(set => set.Reps)];

    private static readonly DateTimeOffset Now = new(2026, 11, 3, 18, 0, 0, TimeSpan.Zero);

    [Fact]
    public void FinishingCompletesItAtThatTime()
    {
        Update(0, isChecked: true);

        _workout.Finish(Now).IsSuccess.ShouldBeTrue();

        _workout.Status.ShouldBe(WorkoutStatus.Completed);
        _workout.FinishedAtUtc.ShouldBe(Now);
    }

    [Fact]
    public void FinishingRemovesUncheckedSetsAndClosesTheGaps()
    {
        Update(1, reps: 6, isChecked: true);
        Update(3, reps: 5, isChecked: true);

        _workout.Finish(Now);

        Exercise.Sets.Select(set => (set.Order, set.Reps)).ShouldBe([(0, 6), (1, 5)]);
    }

    [Fact]
    public void FinishingRemovesAnExerciseLeftWithNoSetsAndClosesTheGap()
    {
        Workout workout = Workout.Start(
            UserId.From(Guid.CreateVersion7()),
            Date,
            RoutineId.New(),
            "Legs",
            [new RoutineExerciseValues(ExerciseId.New(), 1, 8, 10), new RoutineExerciseValues(ExerciseId.New(), 1, 8, 10), new RoutineExerciseValues(ExerciseId.New(), 1, 8, 10)],
            new Dictionary<ExerciseId, List<SetValues>>(),
            null);
        WorkoutExercise last = workout.Exercises[2];
        workout.UpdateSet(workout.Exercises[0].Id, workout.Exercises[0].Sets[0].Id, null, null, true);
        workout.UpdateSet(last.Id, last.Sets[0].Id, null, null, true);

        workout.Finish(Now);

        workout.Exercises.Count.ShouldBe(2);
        last.Order.ShouldBe(1);
    }

    [Fact]
    public void FinishingKeepsThePlannedSetsOfARemovedExercise()
    {
        Workout workout = Workout.Start(
            UserId.From(Guid.CreateVersion7()),
            Date,
            RoutineId.New(),
            "Legs",
            [new RoutineExerciseValues(ExerciseId.New(), 3, 8, 10), new RoutineExerciseValues(ExerciseId.New(), 2, 8, 10)],
            new Dictionary<ExerciseId, List<SetValues>>(),
            null);
        workout.UpdateSet(workout.Exercises[0].Id, workout.Exercises[0].Sets[0].Id, null, null, true);

        workout.Finish(Now);

        workout.Exercises.ShouldHaveSingleItem();
        workout.PlannedSets.ShouldBe(5);
    }

    [Fact]
    public void ASkippedWorkoutPlansItsRoutinesSets()
    {
        Workout skipped = Workout.Skip(UserId.From(Guid.CreateVersion7()), Date, RoutineId.New(), "Legs", [new RoutineExerciseValues(ExerciseId.New(), 3, 8, 10), new RoutineExerciseValues(ExerciseId.New(), 2, 8, 10)]);

        skipped.PlannedSets.ShouldBe(5);
    }

    [Fact]
    public void FinishingWithNothingCheckedChangesNothing()
    {
        _workout.Finish(Now).Error.ShouldBe(WorkoutErrors.NothingChecked);

        _workout.Status.ShouldBe(WorkoutStatus.InProgress);
        Exercise.Sets.Count.ShouldBe(4);
    }

    [Fact]
    public void FinishingTwiceFails()
    {
        Update(0, isChecked: true);
        _workout.Finish(Now);

        _workout.Finish(Now).Error.ShouldBe(WorkoutErrors.NotInProgress);
    }

    [Fact]
    public void RestoringBringsItBackAsItWas()
    {
        _workout.Delete(Now);

        _workout.Restore();

        _workout.DeletedAtUtc.ShouldBeNull();
        _workout.Status.ShouldBe(WorkoutStatus.InProgress);
    }

    [Fact]
    public void AChangedWeightCarriesDownToLaterSets()
    {
        Update(1, weightKg: 50);

        Weights().ShouldBe([0, 50, 50, 50]);
    }

    [Fact]
    public void ChangedRepsCarryDownToLaterSets()
    {
        Update(1, reps: 6);

        Reps().ShouldBe([8, 6, 6, 6]);
    }

    [Fact]
    public void ALaterCheckedSetKeepsItsValues()
    {
        Update(2, isChecked: true);

        Update(0, weightKg: 50, reps: 6);

        Weights().ShouldBe([50, 50, 0, 50]);
        Reps().ShouldBe([6, 6, 8, 6]);
    }

    [Fact]
    public void ALaterSetChangedByHandKeepsThatValueOnly()
    {
        Update(2, weightKg: 30);

        Update(0, weightKg: 50, reps: 6);

        Weights().ShouldBe([50, 50, 30, 50]);
        Reps().ShouldBe([6, 6, 6, 6]);
    }

    [Fact]
    public void ACheckedSetCanBeChangedAndUnchecked()
    {
        Update(0, isChecked: true);
        Update(0, weightKg: 50);

        SetAt(0).WeightKg.ShouldBe(50);
        SetAt(0).Checked.ShouldBeTrue();

        Update(0, isChecked: false);

        SetAt(0).Checked.ShouldBeFalse();
    }

    [Fact]
    public void SavingTheSameValueDoesNotCountAsChangedByHand()
    {
        Update(1, weightKg: 0);

        Update(0, weightKg: 50);

        Weights().ShouldBe([50, 50, 50, 50]);
    }

    [Fact]
    public void ANewSetCopiesTheLastSet()
    {
        Update(3, weightKg: 50, reps: 6);

        Result<Set> result = _workout.AddSet(Exercise.Id);

        result.Value.Order.ShouldBe(4);
        result.Value.WeightKg.ShouldBe(50);
        result.Value.Reps.ShouldBe(6);
        result.Value.Checked.ShouldBeFalse();
    }

    [Fact]
    public void ANewSetDoesNotCopyTheCheck()
    {
        Update(3, isChecked: true);

        _workout.AddSet(Exercise.Id).Value.Checked.ShouldBeFalse();
    }

    [Fact]
    public void AnExerciseHasAtMost20Sets()
    {
        foreach (int _ in Enumerable.Range(0, WorkoutExercise.MaxSets - Exercise.Sets.Count))
        {
            _workout.AddSet(Exercise.Id).IsSuccess.ShouldBeTrue();
        }

        _workout.AddSet(Exercise.Id).Error.ShouldBe(WorkoutErrors.TooManySets);
        _workout.RestoreSet(Exercise.Id, 0, new SetValues(0, 1), false).Error.ShouldBe(WorkoutErrors.TooManySets);
    }

    [Fact]
    public void RemovingASetClosesTheGap()
    {
        Update(2, weightKg: 30);

        _workout.DeleteSet(Exercise.Id, SetAt(1).Id).IsSuccess.ShouldBeTrue();

        Exercise.Sets.Select(set => set.Order).ShouldBe([0, 1, 2]);
        Weights().ShouldBe([0, 30, 30]);
    }

    [Fact]
    public void TheLastSetCanNotBeRemoved()
    {
        while (Exercise.Sets.Count > 1)
        {
            _workout.DeleteSet(Exercise.Id, SetAt(0).Id).IsSuccess.ShouldBeTrue();
        }

        _workout.DeleteSet(Exercise.Id, SetAt(0).Id).Error.ShouldBe(WorkoutErrors.LastSet);
        Exercise.Sets.ShouldHaveSingleItem();
    }

    [Fact]
    public void ARestoredSetGoesBackWhereItWas()
    {
        Result<Set> result = _workout.RestoreSet(Exercise.Id, 1, new SetValues(40, 5), true);

        result.Value.Order.ShouldBe(1);
        result.Value.Checked.ShouldBeTrue();
        Exercise.Sets.Select(set => set.Order).ShouldBe([0, 1, 2, 3, 4]);
        SetAt(1).ShouldBe(result.Value);
    }

    [Fact]
    public void ARestoredSetPastTheEndGoesLast()
    {
        _workout.RestoreSet(Exercise.Id, 15, new SetValues(40, 5), false).Value.Order.ShouldBe(4);
    }

    [Fact]
    public void ARestoredSetKeepsItsValuesWhenAnEarlierSetChanges()
    {
        _workout.RestoreSet(Exercise.Id, 3, new SetValues(40, 5), false);

        Update(0, weightKg: 50, reps: 6);

        SetAt(3).WeightKg.ShouldBe(40);
        SetAt(3).Reps.ShouldBe(5);
    }

    [Fact]
    public void OnlyAWorkoutInProgressCanBeLogged()
    {
        Workout skipped = Workout.Skip(UserId.From(Guid.CreateVersion7()), Date, RoutineId.New(), "Legs", [new RoutineExerciseValues(ExerciseId.New(), 3, 8, 10)]);
        WorkoutExerciseId exerciseId = skipped.Exercises[0].Id;

        skipped.AddSet(exerciseId).Error.ShouldBe(WorkoutErrors.NotInProgress);
        skipped.RestoreSet(exerciseId, 0, new SetValues(0, 1), false).Error.ShouldBe(WorkoutErrors.NotInProgress);
        skipped.UpdateSet(exerciseId, SetId.New(), 10, null, null).Error.ShouldBe(WorkoutErrors.NotInProgress);
        skipped.DeleteSet(exerciseId, SetId.New()).Error.ShouldBe(WorkoutErrors.NotInProgress);
    }

    [Fact]
    public void AnUnknownExerciseOrSetIsNotFound()
    {
        _workout.AddSet(WorkoutExerciseId.New()).Error.ShouldBe(WorkoutErrors.ExerciseNotFound);
        _workout.UpdateSet(Exercise.Id, SetId.New(), 10, null, null).Error.ShouldBe(WorkoutErrors.SetNotFound);
        _workout.DeleteSet(Exercise.Id, SetId.New()).Error.ShouldBe(WorkoutErrors.SetNotFound);
    }
}
