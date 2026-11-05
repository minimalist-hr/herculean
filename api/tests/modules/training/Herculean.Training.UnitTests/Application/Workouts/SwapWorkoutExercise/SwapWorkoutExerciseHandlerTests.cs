using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;
using Herculean.Training.Application.Workouts.SwapWorkoutExercise;

namespace Herculean.Training.UnitTests.Application.Workouts.SwapWorkoutExercise;

public sealed class SwapWorkoutExerciseHandlerTests
{
    private static readonly UserId User = UserId.From(Guid.CreateVersion7());

    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeWorkoutReadRepository _workoutReadRepository = new();
    private readonly FakeExerciseRepository _exerciseRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly SwapWorkoutExerciseHandler _handler;
    private readonly ExerciseId _squat = ExerciseId.New();
    private readonly Workout _workout;
    private readonly Exercise _lunge = Exercise.Create(User, "Lunge", GroupId.New(), []);

    public SwapWorkoutExerciseHandlerTests()
    {
        _workout = Workout.Start(User, new DateOnly(2026, 11, 3), RoutineId.New(), "Legs", [new RoutineExerciseValues(_squat, 2, 8, 10)], new Dictionary<ExerciseId, List<SetValues>>(), null);
        _workoutRepository.Add(_workout);
        _exerciseRepository.Add(_lunge);
        _workoutReadRepository.Workout = new WorkoutDetailsResponse(_workout.Id.Value, _workout.Date, _workout.Status, _workout.Name, null, []);
        _handler = new SwapWorkoutExerciseHandler(new SwapWorkoutExerciseValidator(), _workoutRepository, _workoutReadRepository, _exerciseRepository, _unitOfWork);
    }

    private WorkoutExercise Swapped => _workout.Exercises[0];

    private Task<Result<WorkoutDetailsResponse>> SwapAsync(SwapWorkoutExerciseRequest request) =>
        _handler.HandleAsync(_workout.Id.Value, Swapped.Id.Value, request, TestContext.Current.CancellationToken);

    [Fact]
    public async Task SwapsAndStartsFromLastTime()
    {
        _workoutReadRepository.LastTime[_lunge.Id] = new LastTimeResponse(new DateOnly(2026, 10, 27), [new LastTimeSetResponse(30, 6)]);

        Result<WorkoutDetailsResponse> result = await SwapAsync(new SwapWorkoutExerciseRequest(_lunge.Id.Value));

        result.Value.Id.ShouldBe(_workout.Id.Value);
        Swapped.ExerciseId.ShouldBe(_lunge.Id);
        Swapped.Sets.Select(set => (set.WeightKg, set.Reps)).ShouldBe([(30m, 6), (30m, 6)]);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task SendingTheSetsPutsTheirValuesBack()
    {
        Result<WorkoutDetailsResponse> result = await SwapAsync(new SwapWorkoutExerciseRequest(_lunge.Id.Value, [new SwappedSet(80, 10), new SwappedSet(82.5m, 8)]));

        result.IsSuccess.ShouldBeTrue();
        Swapped.Sets.Select(set => (set.WeightKg, set.Reps)).ShouldBe([(80m, 10), (82.5m, 8)]);
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result<WorkoutDetailsResponse> result = await _handler.HandleAsync(Guid.CreateVersion7(), Swapped.Id.Value, new SwapWorkoutExerciseRequest(_lunge.Id.Value), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
    }

    [Fact]
    public async Task AnExerciseOfSomeoneElseIsNotFound()
    {
        Result<WorkoutDetailsResponse> result = await SwapAsync(new SwapWorkoutExerciseRequest(Guid.CreateVersion7()));

        result.Error.ShouldBe(ExerciseErrors.NotFound);
    }

    [Fact]
    public async Task CheckedSetsAreRefused()
    {
        _workout.UpdateSet(Swapped.Id, Swapped.Sets[0].Id, null, null, true);

        Result<WorkoutDetailsResponse> result = await SwapAsync(new SwapWorkoutExerciseRequest(_lunge.Id.Value));

        result.Error.ShouldBe(WorkoutErrors.ExerciseHasCheckedSets);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AMissingExerciseIsNotValid()
    {
        (await SwapAsync(new SwapWorkoutExerciseRequest(Guid.Empty))).Error!.Code.ShouldBe("validation");
    }

    [Fact]
    public async Task InvalidSetsAreNotValid()
    {
        (await SwapAsync(new SwapWorkoutExerciseRequest(_lunge.Id.Value, []))).Error!.Code.ShouldBe("validation");
        (await SwapAsync(new SwapWorkoutExerciseRequest(_lunge.Id.Value, [new SwappedSet(2000, 8)]))).Error!.Code.ShouldBe("validation");
        (await SwapAsync(new SwapWorkoutExerciseRequest(_lunge.Id.Value, [new SwappedSet(20, 0)]))).Error!.Code.ShouldBe("validation");
    }
}
