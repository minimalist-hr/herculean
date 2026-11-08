using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts;
using Herculean.Training.Application.Workouts.EditWorkout;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Application.Workouts.EditWorkout;

public sealed class EditWorkoutHandlerTests
{
    private static readonly UserId User = UserId.From(Guid.CreateVersion7());
    private static readonly DateTimeOffset Now = new(2026, 11, 3, 19, 0, 0, TimeSpan.Zero);

    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeExerciseRepository _exerciseRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly EditWorkoutHandler _handler;
    private readonly Exercise _squat = Exercise.Create(User, "Squat", GroupId.New(), []);
    private readonly Exercise _curl = Exercise.Create(User, "Curl", GroupId.New(), []);
    private readonly Workout _workout;

    public EditWorkoutHandlerTests()
    {
        _workout = Workout.Start(User, new DateOnly(2026, 11, 3), RoutineId.New(), "Legs", [new RoutineExerciseValues(_squat.Id, 2, 8, 10)], new Dictionary<ExerciseId, List<SetValues>>(), null);
        WorkoutExercise squat = _workout.Exercises[0];
        _workout.UpdateSet(squat.Id, squat.Sets[0].Id, 100, 5, true);
        _workout.Finish(Now);
        _workoutRepository.Add(_workout);
        _exerciseRepository.Add(_squat);
        _exerciseRepository.Add(_curl);
        _handler = new EditWorkoutHandler(new EditWorkoutValidator(), _workoutRepository, _exerciseRepository, _unitOfWork);
    }

    private EditedWorkoutExercise KeptSquat(params EditedWorkoutSet[] sets) =>
        new(_workout.Exercises[0].Id.Value, _squat.Id.Value, [.. sets]);

    private Task<Result<WorkoutResponse>> EditAsync(params EditedWorkoutExercise[] exercises) =>
        _handler.HandleAsync(_workout.Id.Value, new EditWorkoutRequest([.. exercises]), TestContext.Current.CancellationToken);

    [Fact]
    public async Task ReplacesTheSetsAndAddsExercisesInOrder()
    {
        Result<WorkoutResponse> result = await EditAsync(
            new EditedWorkoutExercise(null, _curl.Id.Value, [new EditedWorkoutSet(20, 12)]),
            KeptSquat(new EditedWorkoutSet(105, 5), new EditedWorkoutSet(100, 6)));

        result.IsSuccess.ShouldBeTrue();
        _unitOfWork.Saved.ShouldBeTrue();
        WorkoutExercise curl = _workout.Exercises.Single(exercise => exercise.ExerciseId == _curl.Id);
        curl.Order.ShouldBe(0);
        curl.TargetSets.ShouldBe(WorkoutExercise.StartingTargetSets);
        WorkoutExercise squat = _workout.Exercises.Single(exercise => exercise.ExerciseId == _squat.Id);
        squat.Order.ShouldBe(1);
        squat.TargetSets.ShouldBe(2);
        squat.Sets.Select(set => (set.WeightKg, set.Reps, set.Checked)).ShouldBe([(105m, 5, true), (100m, 6, true)]);
    }

    [Fact]
    public async Task AnExerciseLeftOutIsRemoved()
    {
        await EditAsync(new EditedWorkoutExercise(null, _curl.Id.Value, [new EditedWorkoutSet(20, 12)]));

        _workout.Exercises.ShouldHaveSingleItem().ExerciseId.ShouldBe(_curl.Id);
    }

    [Fact]
    public async Task AnAddedExerciseThatIsGoneIsNotFound()
    {
        Result<WorkoutResponse> result = await EditAsync(new EditedWorkoutExercise(null, ExerciseId.New().Value, [new EditedWorkoutSet(20, 12)]));

        result.Error.ShouldBe(ExerciseErrors.NotFound);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AnUnknownWorkoutExerciseIsNotFound()
    {
        Result<WorkoutResponse> result = await EditAsync(new EditedWorkoutExercise(Guid.CreateVersion7(), _squat.Id.Value, [new EditedWorkoutSet(20, 12)]));

        result.Error.ShouldBe(WorkoutErrors.ExerciseNotFound);
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result<WorkoutResponse> result = await _handler.HandleAsync(Guid.CreateVersion7(), new EditWorkoutRequest([KeptSquat(new EditedWorkoutSet(100, 5))]), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
    }

    [Fact]
    public async Task AWorkoutInProgressCanNotBeEdited()
    {
        Workout running = Workout.Start(User, new DateOnly(2026, 11, 4), RoutineId.New(), "Legs", [new RoutineExerciseValues(_squat.Id, 1, 8, 10)], new Dictionary<ExerciseId, List<SetValues>>(), null);
        _workoutRepository.Add(running);

        Result<WorkoutResponse> result = await _handler.HandleAsync(
            running.Id.Value,
            new EditWorkoutRequest([new EditedWorkoutExercise(running.Exercises[0].Id.Value, _squat.Id.Value, [new EditedWorkoutSet(100, 5)])]),
            TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.NotCompleted);
    }

    [Fact]
    public async Task NoExercisesFailsWithAFieldError()
    {
        Result<WorkoutResponse> result = await EditAsync();

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
        result.Error.Fields.ShouldContainKey("exercises");
    }

    [Fact]
    public async Task ARepeatedExerciseFailsWithAFieldError()
    {
        Result<WorkoutResponse> result = await EditAsync(
            KeptSquat(new EditedWorkoutSet(100, 5)),
            new EditedWorkoutExercise(null, _squat.Id.Value, [new EditedWorkoutSet(100, 5)]));

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
    }

    [Theory]
    [InlineData(-1, 5)]
    [InlineData(100, 0)]
    public async Task AnInvalidSetFailsWithAFieldError(int weightKg, int reps)
    {
        Result<WorkoutResponse> result = await EditAsync(KeptSquat(new EditedWorkoutSet(weightKg, reps)));

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
    }

    [Fact]
    public async Task AnExerciseWithNoSetsFailsWithAFieldError()
    {
        Result<WorkoutResponse> result = await EditAsync(KeptSquat());

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
    }
}
