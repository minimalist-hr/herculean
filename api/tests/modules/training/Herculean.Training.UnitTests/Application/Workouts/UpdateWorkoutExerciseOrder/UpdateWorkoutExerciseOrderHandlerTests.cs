using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts.UpdateWorkoutExerciseOrder;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Application.Workouts.UpdateWorkoutExerciseOrder;

public sealed class UpdateWorkoutExerciseOrderHandlerTests
{
    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly UpdateWorkoutExerciseOrderHandler _handler;
    private readonly Workout _workout = Workout.Start(
        UserId.From(Guid.CreateVersion7()),
        new DateOnly(2026, 11, 3),
        RoutineId.New(),
        "Legs",
        [new RoutineExerciseValues(ExerciseId.New(), 2, 8, 10), new RoutineExerciseValues(ExerciseId.New(), 2, 8, 10)],
        new Dictionary<ExerciseId, List<SetValues>>(),
        null);

    public UpdateWorkoutExerciseOrderHandlerTests()
    {
        _workoutRepository.Add(_workout);
        _handler = new UpdateWorkoutExerciseOrderHandler(new UpdateWorkoutExerciseOrderValidator(), _workoutRepository, _unitOfWork);
    }

    private Task<Result> ReorderAsync(params Guid[] ids) =>
        _handler.HandleAsync(_workout.Id.Value, new UpdateWorkoutExerciseOrderRequest([.. ids]), TestContext.Current.CancellationToken);

    [Fact]
    public async Task SavesTheNewOrder()
    {
        WorkoutExercise first = _workout.Exercises[0];
        WorkoutExercise second = _workout.Exercises[1];

        Result result = await ReorderAsync(second.Id.Value, first.Id.Value);

        result.IsSuccess.ShouldBeTrue();
        second.Order.ShouldBe(0);
        first.Order.ShouldBe(1);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AnOrderThatMissesOneIsOutOfDate()
    {
        Result result = await ReorderAsync(_workout.Exercises[0].Id.Value);

        result.Error.ShouldBe(WorkoutErrors.OrderOutOfDate);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task ARepeatedExerciseIsNotValid()
    {
        Guid id = _workout.Exercises[0].Id.Value;

        Result result = await ReorderAsync(id, id);

        result.Error!.Code.ShouldBe("validation");
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result result = await _handler.HandleAsync(Guid.CreateVersion7(), new UpdateWorkoutExerciseOrderRequest([]), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
    }
}
