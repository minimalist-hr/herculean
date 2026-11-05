using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;
using Herculean.Training.Application.Workouts.AddWorkoutExercises;

namespace Herculean.Training.UnitTests.Application.Workouts.AddWorkoutExercises;

public sealed class AddWorkoutExercisesHandlerTests
{
    private static readonly UserId User = UserId.From(Guid.CreateVersion7());

    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeWorkoutReadRepository _workoutReadRepository = new();
    private readonly FakeExerciseRepository _exerciseRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly AddWorkoutExercisesHandler _handler;
    private readonly Workout _workout = Workout.Start(User, new DateOnly(2026, 11, 3), RoutineId.New(), "Legs", [new RoutineExerciseValues(ExerciseId.New(), 2, 8, 10)], new Dictionary<ExerciseId, List<SetValues>>(), null);
    private readonly Exercise _curl = Exercise.Create(User, "Curl", GroupId.New(), []);

    public AddWorkoutExercisesHandlerTests()
    {
        _workoutRepository.Add(_workout);
        _exerciseRepository.Add(_curl);
        _workoutReadRepository.Workout = new WorkoutDetailsResponse(_workout.Id.Value, _workout.Date, _workout.Status, _workout.Name, null, []);
        _handler = new AddWorkoutExercisesHandler(new AddWorkoutExercisesValidator(), _workoutRepository, _workoutReadRepository, _exerciseRepository, _unitOfWork);
    }

    private Task<Result<WorkoutDetailsResponse>> AddAsync(AddWorkoutExercisesRequest request) =>
        _handler.HandleAsync(_workout.Id.Value, request, TestContext.Current.CancellationToken);

    [Fact]
    public async Task AddsTheExercisesAndReturnsTheWorkout()
    {
        Result<WorkoutDetailsResponse> result = await AddAsync(new AddWorkoutExercisesRequest([_curl.Id.Value]));

        result.Value.Id.ShouldBe(_workout.Id.Value);
        _workout.Exercises.Count.ShouldBe(2);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task ARemovedExerciseGoesBackWithItsSets()
    {
        RemovedExercise removed = new(0, _curl.Id.Value, 1, 8, 10, [new RemovedExerciseSet(20, 12, true)]);

        Result<WorkoutDetailsResponse> result = await AddAsync(new AddWorkoutExercisesRequest(Removed: removed));

        result.IsSuccess.ShouldBeTrue();
        WorkoutExercise back = _workout.Exercises.Single(exercise => exercise.ExerciseId == _curl.Id);
        back.Order.ShouldBe(0);
        back.Sets.ShouldHaveSingleItem().Checked.ShouldBeTrue();
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result<WorkoutDetailsResponse> result = await _handler.HandleAsync(Guid.CreateVersion7(), new AddWorkoutExercisesRequest([_curl.Id.Value]), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
    }

    [Fact]
    public async Task AnExerciseOfSomeoneElseIsNotFound()
    {
        Result<WorkoutDetailsResponse> result = await AddAsync(new AddWorkoutExercisesRequest([Guid.CreateVersion7()]));

        result.Error.ShouldBe(ExerciseErrors.NotFound);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AnExerciseAlreadyInIsRefused()
    {
        await AddAsync(new AddWorkoutExercisesRequest([_curl.Id.Value]));

        Result<WorkoutDetailsResponse> result = await AddAsync(new AddWorkoutExercisesRequest([_curl.Id.Value]));

        result.Error.ShouldBe(WorkoutErrors.ExerciseAlreadyIn);
    }

    [Fact]
    public async Task NothingToAddIsNotValid()
    {
        (await AddAsync(new AddWorkoutExercisesRequest())).Error!.Code.ShouldBe("validation");
        (await AddAsync(new AddWorkoutExercisesRequest([]))).Error!.Code.ShouldBe("validation");
    }

    [Fact]
    public async Task BothAtOnceIsNotValid()
    {
        RemovedExercise removed = new(0, _curl.Id.Value, 1, 8, 10, [new RemovedExerciseSet(20, 12, true)]);

        (await AddAsync(new AddWorkoutExercisesRequest([_curl.Id.Value], removed))).Error!.Code.ShouldBe("validation");
    }

    [Fact]
    public async Task ARepeatedExerciseIsNotValid()
    {
        (await AddAsync(new AddWorkoutExercisesRequest([_curl.Id.Value, _curl.Id.Value]))).Error!.Code.ShouldBe("validation");
    }

    [Theory]
    [InlineData(-1, 1, 8, 10, 20, 12)]
    [InlineData(0, 0, 8, 10, 20, 12)]
    [InlineData(0, 1, 11, 10, 20, 12)]
    [InlineData(0, 1, 8, 10, 2000, 12)]
    [InlineData(0, 1, 8, 10, 20, 0)]
    public async Task ARemovedExerciseMustBeValid(int order, int sets, int from, int to, int weightKg, int reps)
    {
        RemovedExercise removed = new(order, _curl.Id.Value, sets, from, to, [new RemovedExerciseSet(weightKg, reps, false)]);

        (await AddAsync(new AddWorkoutExercisesRequest(Removed: removed))).Error!.Code.ShouldBe("validation");
    }

    [Fact]
    public async Task ARemovedExerciseNeedsASet()
    {
        RemovedExercise removed = new(0, _curl.Id.Value, 1, 8, 10, []);

        (await AddAsync(new AddWorkoutExercisesRequest(Removed: removed))).Error!.Code.ShouldBe("validation");
    }
}
