using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Domain.Workouts;

public sealed class WorkoutLengthenedPartialsTests
{
    private static readonly Dictionary<ExerciseId, List<SetValues>> NoLastTime = [];

    private readonly ExerciseId _curl = ExerciseId.New();
    private readonly Workout _workout;

    public WorkoutLengthenedPartialsTests()
    {
        _workout = Workout.Start(
            UserId.From(Guid.CreateVersion7()),
            new DateOnly(2026, 11, 11),
            RoutineId.New(),
            "Arms",
            [new RoutineExerciseValues(_curl, 2, 8, 10, LengthenedPartials: true)],
            NoLastTime,
            null);
    }

    private WorkoutExercise Curl => _workout.Exercises[0];

    [Fact]
    public void AStartedWorkoutCopiesTheFlag()
    {
        Curl.LengthenedPartials.ShouldBeTrue();
    }

    [Fact]
    public void ASetCanBeMarkedWithPartialsDone()
    {
        _workout.UpdateSet(Curl.Id, Curl.Sets[0].Id, null, null, true, partialsDone: true).IsSuccess.ShouldBeTrue();

        Curl.Sets[0].PartialsDone.ShouldBeTrue();
        Curl.Sets[1].PartialsDone.ShouldBeFalse();
    }

    [Fact]
    public void TheFlagCanBeTurnedOffForThisWorkout()
    {
        _workout.ChangeLengthenedPartials(Curl.Id, false).IsSuccess.ShouldBeTrue();

        Curl.LengthenedPartials.ShouldBeFalse();
    }

    [Fact]
    public void ANewSetDoesNotCopyPartialsDone()
    {
        _workout.UpdateSet(Curl.Id, Curl.Sets[1].Id, null, null, true, partialsDone: true);

        _workout.AddSet(Curl.Id).Value.PartialsDone.ShouldBeFalse();
    }

    [Fact]
    public void ARemovedSetComesBackWithItsPartials()
    {
        _workout.RestoreSet(Curl.Id, 0, new SetValues(20, 10, PartialsDone: true), true).Value.PartialsDone.ShouldBeTrue();
    }

    [Fact]
    public void ASwapTurnsThemOffAndUndoingItBringsThemBack()
    {
        _workout.UpdateSet(Curl.Id, Curl.Sets[0].Id, null, null, null, partialsDone: true);
        ExerciseId hammer = ExerciseId.New();

        _workout.SwapExercise(Curl.Id, hammer, []).IsSuccess.ShouldBeTrue();
        WorkoutExercise swapped = _workout.Exercises[0];
        swapped.LengthenedPartials.ShouldBeFalse();
        swapped.Sets[0].PartialsDone.ShouldBeFalse();

        _workout.SwapExerciseBack(swapped.Id, _curl, [new SetValues(20, 10)], lengthenedPartials: true).IsSuccess.ShouldBeTrue();
        _workout.Exercises[0].LengthenedPartials.ShouldBeTrue();
    }

    [Fact]
    public void EditingKeepsWhatItIsGiven()
    {
        _workout.UpdateSet(Curl.Id, Curl.Sets[0].Id, null, null, true);
        _workout.Finish(DateTimeOffset.UtcNow);

        _workout.Edit([new EditedExercise(Curl.Id, _curl, [new SetValues(20, 10, PartialsDone: true)], LengthenedPartials: false)]).IsSuccess.ShouldBeTrue();

        Curl.LengthenedPartials.ShouldBeFalse();
        Curl.Sets[0].PartialsDone.ShouldBeTrue();
    }
}
