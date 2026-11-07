using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts;
using Herculean.Training.Application.Workouts.ListWorkouts;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.UnitTests.Application.Workouts.ListWorkouts;

public sealed class ListWorkoutsHandlerTests
{
    private readonly FakeWorkoutReadRepository _workoutReadRepository = new();
    private readonly ListWorkoutsHandler _handler;

    public ListWorkoutsHandlerTests()
    {
        _handler = new ListWorkoutsHandler(new ListWorkoutsValidator(), _workoutReadRepository);
    }

    [Fact]
    public async Task InProgressReadsOnlyTheWorkoutInProgress()
    {
        WorkoutResponse inProgress = new(Guid.CreateVersion7(), new DateOnly(2026, 11, 6), WorkoutStatus.InProgress, "Chest and arms 2");
        _workoutReadRepository.Workouts.Add(inProgress);
        _workoutReadRepository.Workouts.Add(new WorkoutResponse(Guid.CreateVersion7(), new DateOnly(2026, 11, 5), WorkoutStatus.Completed, "Legs 1"));

        Result<List<WorkoutResponse>> result = await _handler.HandleAsync(new ListWorkoutsRequest("inProgress"), TestContext.Current.CancellationToken);

        result.Value.ShouldHaveSingleItem().ShouldBe(inProgress);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("completed")]
    [InlineData("InProgress")]
    public async Task AnyOtherStatusFailsWithAFieldError(string? status)
    {
        Result<List<WorkoutResponse>> result = await _handler.HandleAsync(new ListWorkoutsRequest(status), TestContext.Current.CancellationToken);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
        result.Error.Fields.ShouldContainKey("status");
    }
}
