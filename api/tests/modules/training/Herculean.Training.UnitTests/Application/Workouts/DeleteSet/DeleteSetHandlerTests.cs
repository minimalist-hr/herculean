using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts.DeleteSet;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Application.Workouts.DeleteSet;

public sealed class DeleteSetHandlerTests
{
    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly DeleteSetHandler _handler;
    private readonly Workout _workout = Workout.Start(
        UserId.From(Guid.CreateVersion7()),
        new DateOnly(2026, 11, 3),
        RoutineId.New(),
        "Legs",
        [new RoutineExerciseValues(ExerciseId.New(), 2, 8, 10)],
        new Dictionary<ExerciseId, List<SetValues>>(),
        null);

    public DeleteSetHandlerTests()
    {
        _workoutRepository.Add(_workout);
        _handler = new DeleteSetHandler(_workoutRepository, _unitOfWork);
    }

    private WorkoutExercise Exercise => _workout.Exercises[0];

    private Task<Result> DeleteAsync() =>
        _handler.HandleAsync(_workout.Id.Value, Exercise.Id.Value, Exercise.Sets[0].Id.Value, TestContext.Current.CancellationToken);

    [Fact]
    public async Task TheSetIsRemoved()
    {
        Result result = await DeleteAsync();

        result.IsSuccess.ShouldBeTrue();
        Exercise.Sets.ShouldHaveSingleItem().Order.ShouldBe(0);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task TheLastSetStays()
    {
        await DeleteAsync();

        Result result = await DeleteAsync();

        result.Error.ShouldBe(WorkoutErrors.LastSet);
        Exercise.Sets.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result result = await _handler.HandleAsync(Guid.CreateVersion7(), Exercise.Id.Value, Exercise.Sets[0].Id.Value, TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
    }
}
