using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts.DeleteWorkoutExercise;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Application.Workouts.DeleteWorkoutExercise;

public sealed class DeleteWorkoutExerciseHandlerTests
{
    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly DeleteWorkoutExerciseHandler _handler;
    private readonly Workout _workout = Workout.Start(UserId.From(Guid.CreateVersion7()), new DateOnly(2026, 11, 3), RoutineId.New(), "Legs", [new RoutineExerciseValues(ExerciseId.New(), 2, 8, 10)], new Dictionary<ExerciseId, List<SetValues>>(), null);

    public DeleteWorkoutExerciseHandlerTests()
    {
        _workoutRepository.Add(_workout);
        _handler = new DeleteWorkoutExerciseHandler(_workoutRepository, _unitOfWork);
    }

    [Fact]
    public async Task TheExerciseIsRemoved()
    {
        Result result = await _handler.HandleAsync(_workout.Id.Value, _workout.Exercises[0].Id.Value, TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
        _workout.Exercises.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result result = await _handler.HandleAsync(Guid.CreateVersion7(), _workout.Exercises[0].Id.Value, TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
    }

    [Fact]
    public async Task AnUnknownExerciseIsNotFound()
    {
        Result result = await _handler.HandleAsync(_workout.Id.Value, Guid.CreateVersion7(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.ExerciseNotFound);
        _unitOfWork.Saved.ShouldBeFalse();
    }
}
