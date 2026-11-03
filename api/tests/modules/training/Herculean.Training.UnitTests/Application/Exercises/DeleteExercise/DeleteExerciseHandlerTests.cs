using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Exercises.DeleteExercise;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.UnitTests.Application.Exercises.DeleteExercise;

public sealed class DeleteExerciseHandlerTests
{
    private readonly FakeExerciseRepository _exerciseRepository = new();
    private readonly FakeRoutineRepository _routineRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly DeleteExerciseHandler _handler;
    private readonly Exercise _exercise = Exercise.Create(UserId.From(Guid.CreateVersion7()), "Bench press", GroupId.New(), []);

    public DeleteExerciseHandlerTests()
    {
        _exerciseRepository.Add(_exercise);
        _handler = new DeleteExerciseHandler(_exerciseRepository, _routineRepository, _unitOfWork, TimeProvider.System);
    }

    [Fact]
    public async Task TheExerciseIsMarkedDeleted()
    {
        Result result = await _handler.HandleAsync(_exercise.Id.Value, TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
        _exercise.DeletedAtUtc.ShouldNotBeNull();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AnExerciseInARoutineIsKept()
    {
        _routineRepository.Add(Routine.Create(
            _exercise.UserId,
            "Legs",
            [new RoutineExerciseValues(_exercise.Id, 3, 8, 10), new RoutineExerciseValues(ExerciseId.New(), 3, 8, 10)]));

        Result result = await _handler.HandleAsync(_exercise.Id.Value, TestContext.Current.CancellationToken);

        result.Error.ShouldBe(ExerciseErrors.InRoutine);
        _exercise.DeletedAtUtc.ShouldBeNull();
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task ADeletedRoutineDoesNotHoldItsExercises()
    {
        Routine routine = Routine.Create(_exercise.UserId, "Legs", [new RoutineExerciseValues(_exercise.Id, 3, 8, 10)]);
        routine.Delete(DateTimeOffset.UnixEpoch);
        _routineRepository.Add(routine);

        Result result = await _handler.HandleAsync(_exercise.Id.Value, TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task AnUnknownExerciseIsNotFound()
    {
        Result result = await _handler.HandleAsync(Guid.CreateVersion7(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(ExerciseErrors.NotFound);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AnExerciseAlreadyDeletedIsNotFound()
    {
        await _handler.HandleAsync(_exercise.Id.Value, TestContext.Current.CancellationToken);

        Result result = await _handler.HandleAsync(_exercise.Id.Value, TestContext.Current.CancellationToken);

        result.Error.ShouldBe(ExerciseErrors.NotFound);
    }
}
