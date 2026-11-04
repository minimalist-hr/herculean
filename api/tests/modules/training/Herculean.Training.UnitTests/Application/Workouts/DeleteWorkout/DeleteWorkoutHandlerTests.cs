using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts.DeleteWorkout;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Application.Workouts.DeleteWorkout;

public sealed class DeleteWorkoutHandlerTests
{
    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly DeleteWorkoutHandler _handler;
    private readonly Workout _workout = Workout.Skip(UserId.From(Guid.CreateVersion7()), new DateOnly(2026, 11, 3), RoutineId.New(), "Legs", []);

    public DeleteWorkoutHandlerTests()
    {
        _workoutRepository.Add(_workout);
        _handler = new DeleteWorkoutHandler(_workoutRepository, _unitOfWork, TimeProvider.System);
    }

    [Fact]
    public async Task TheWorkoutIsMarkedDeleted()
    {
        Result result = await _handler.HandleAsync(_workout.Id.Value, TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
        _workout.DeletedAtUtc.ShouldNotBeNull();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result result = await _handler.HandleAsync(Guid.CreateVersion7(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AWorkoutAlreadyDeletedIsNotFound()
    {
        _workout.Delete(DateTimeOffset.UtcNow);

        Result result = await _handler.HandleAsync(_workout.Id.Value, TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
    }
}
