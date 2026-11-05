using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Application.Workouts.GetWorkout;

public sealed class GetWorkoutHandlerTests
{
    private readonly FakeWorkoutReadRepository _workoutReadRepository = new();
    private readonly GetWorkoutHandler _handler;

    public GetWorkoutHandlerTests()
    {
        _handler = new GetWorkoutHandler(_workoutReadRepository);
    }

    [Fact]
    public async Task ReturnsTheWorkout()
    {
        WorkoutDetailsResponse workout = new(Guid.CreateVersion7(), new DateOnly(2026, 11, 3), WorkoutStatus.InProgress, "Legs", null, []);
        _workoutReadRepository.Workout = workout;

        Result<WorkoutDetailsResponse> result = await _handler.HandleAsync(workout.Id, TestContext.Current.CancellationToken);

        result.Value.ShouldBe(workout);
    }

    [Fact]
    public async Task AnUnknownWorkoutIsNotFound()
    {
        Result<WorkoutDetailsResponse> result = await _handler.HandleAsync(Guid.CreateVersion7(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(WorkoutErrors.NotFound);
    }
}
