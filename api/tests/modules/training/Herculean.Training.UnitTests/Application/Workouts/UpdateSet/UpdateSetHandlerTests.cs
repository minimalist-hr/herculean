using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts;
using Herculean.Training.Application.Workouts.UpdateSet;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Application.Workouts.UpdateSet;

public sealed class UpdateSetHandlerTests
{
    private readonly FakeWorkoutRepository _workoutRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly UpdateSetHandler _handler;
    private readonly Workout _workout = Workout.Start(
        UserId.From(Guid.CreateVersion7()),
        new DateOnly(2026, 11, 3),
        RoutineId.New(),
        "Legs",
        [new RoutineExerciseValues(ExerciseId.New(), 2, 8, 10)],
        new Dictionary<ExerciseId, List<SetValues>>(),
        null);

    public UpdateSetHandlerTests()
    {
        _workoutRepository.Add(_workout);
        _handler = new UpdateSetHandler(new UpdateSetValidator(), _workoutRepository, _unitOfWork);
    }

    private WorkoutExercise Exercise => _workout.Exercises[0];

    private Task<Result<List<SetResponse>>> UpdateAsync(UpdateSetRequest request) =>
        _handler.HandleAsync(_workout.Id.Value, Exercise.Id.Value, Exercise.Sets[0].Id.Value, request, TestContext.Current.CancellationToken);

    [Fact]
    public async Task ReturnsAllOfTheExercisesSets()
    {
        Result<List<SetResponse>> result = await UpdateAsync(new UpdateSetRequest(WeightKg: 42.5m, Reps: 6, Checked: true));

        result.Value.Select(set => (set.Order, set.WeightKg, set.Reps, set.Checked)).ShouldBe([(0, 42.5m, 6, true), (1, 42.5m, 6, false)]);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AFieldLeftOutStaysTheSame()
    {
        Result<List<SetResponse>> result = await UpdateAsync(new UpdateSetRequest(Checked: true));

        result.Value[0].WeightKg.ShouldBe(0);
        result.Value[0].Reps.ShouldBe(8);
        result.Value[0].Checked.ShouldBeTrue();
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result<List<SetResponse>> result = await _handler.HandleAsync(Guid.CreateVersion7(), Exercise.Id.Value, Exercise.Sets[0].Id.Value, new UpdateSetRequest(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AnUnknownSetIsNotFound()
    {
        Result<List<SetResponse>> result = await _handler.HandleAsync(_workout.Id.Value, Exercise.Id.Value, Guid.CreateVersion7(), new UpdateSetRequest(Checked: true), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.SetNotFound);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1000)]
    [InlineData(2.25)]
    public async Task AValidWeightIsAccepted(double weightKg)
    {
        Result<List<SetResponse>> result = await UpdateAsync(new UpdateSetRequest(WeightKg: (decimal)weightKg));

        result.IsSuccess.ShouldBeTrue();
    }

    [Theory]
    [InlineData(-0.5)]
    [InlineData(1000.01)]
    [InlineData(2.255)]
    public async Task AnInvalidWeightIsRejected(double weightKg)
    {
        Result<List<SetResponse>> result = await UpdateAsync(new UpdateSetRequest(WeightKg: (decimal)weightKg));

        result.Error!.Code.ShouldBe("validation");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    public async Task InvalidRepsAreRejected(int reps)
    {
        Result<List<SetResponse>> result = await UpdateAsync(new UpdateSetRequest(Reps: reps));

        result.Error!.Code.ShouldBe("validation");
    }
}
