using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts;
using Herculean.Training.Application.Workouts.AddSet;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Application.Workouts.AddSet;

public sealed class AddSetHandlerTests
{
    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly AddSetHandler _handler;
    private readonly Workout _workout = Workout.Start(
        UserId.From(Guid.CreateVersion7()),
        new DateOnly(2026, 11, 3),
        RoutineId.New(),
        "Legs",
        [new RoutineExerciseValues(ExerciseId.New(), 2, 8, 10)],
        new Dictionary<ExerciseId, List<SetValues>>(),
        null);

    public AddSetHandlerTests()
    {
        _workoutRepository.Add(_workout);
        _handler = new AddSetHandler(new AddSetValidator(), _workoutRepository, _unitOfWork);
    }

    private Task<Result<SetResponse>> AddAsync(AddSetRequest request) =>
        _handler.HandleAsync(_workout.Id.Value, _workout.Exercises[0].Id.Value, request, TestContext.Current.CancellationToken);

    [Fact]
    public async Task AnEmptyRequestAddsACopyOfTheLastSet()
    {
        Result<SetResponse> result = await AddAsync(new AddSetRequest());

        result.Value.Order.ShouldBe(2);
        result.Value.Reps.ShouldBe(8);
        _workout.Exercises[0].Sets.Count.ShouldBe(3);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task ARemovedSetGoesBackWhereItWas()
    {
        Result<SetResponse> result = await AddAsync(new AddSetRequest(new RemovedSet(1, 42.5m, 6, true)));

        result.Value.ShouldBe(new SetResponse(result.Value.Id, 1, 42.5m, 6, true));
        _workout.Exercises[0].Sets[1].Id.Value.ShouldBe(result.Value.Id);
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result<SetResponse> result = await _handler.HandleAsync(Guid.CreateVersion7(), _workout.Exercises[0].Id.Value, new AddSetRequest(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AnUnknownExerciseIsNotFound()
    {
        Result<SetResponse> result = await _handler.HandleAsync(_workout.Id.Value, Guid.CreateVersion7(), new AddSetRequest(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.ExerciseNotFound);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Theory]
    [InlineData(-1, 10, 5)]
    [InlineData(0, -1, 5)]
    [InlineData(0, 1000.01, 5)]
    [InlineData(0, 2.255, 5)]
    [InlineData(0, 10, 0)]
    [InlineData(0, 10, 101)]
    public async Task ARemovedSetMustBeValid(int order, double weightKg, int reps)
    {
        Result<SetResponse> result = await AddAsync(new AddSetRequest(new RemovedSet(order, (decimal)weightKg, reps, false)));

        result.Error!.Code.ShouldBe("validation");
        _unitOfWork.Saved.ShouldBeFalse();
    }
}
