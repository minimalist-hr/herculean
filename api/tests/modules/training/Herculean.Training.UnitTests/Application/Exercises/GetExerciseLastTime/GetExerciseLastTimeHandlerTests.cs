using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Exercises.GetExerciseLastTime;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.UnitTests.Application.Exercises.GetExerciseLastTime;

public sealed class GetExerciseLastTimeHandlerTests
{
    private static readonly DateOnly Before = new(2026, 11, 3);

    private readonly ExerciseId _id = ExerciseId.New();
    private readonly FakeExerciseReadRepository _exerciseReadRepository = new();
    private readonly FakeWorkoutReadRepository _workoutReadRepository = new();
    private readonly GetExerciseLastTimeHandler _handler;

    public GetExerciseLastTimeHandlerTests()
    {
        _exerciseReadRepository.Existing.Add(_id);
        _handler = new GetExerciseLastTimeHandler(new GetExerciseLastTimeValidator(), _exerciseReadRepository, _workoutReadRepository);
    }

    [Fact]
    public async Task ReturnsTheSetsLastTime()
    {
        LastTimeResponse lastTime = new(Before.AddDays(-7), [new LastTimeSetResponse(100, 5)]);
        _workoutReadRepository.LastTime[_id] = lastTime;

        ExerciseLastTimeResponse response = (await HandleAsync(_id.Value, Before)).Value;

        response.LastTime.ShouldBe(lastTime);
    }

    [Fact]
    public async Task AnExerciseNotDoneBeforeHasNoLastTime()
    {
        ExerciseLastTimeResponse response = (await HandleAsync(_id.Value, Before)).Value;

        response.LastTime.ShouldBeNull();
    }

    [Fact]
    public async Task AnUnknownExerciseFailsAsNotFound()
    {
        Result<ExerciseLastTimeResponse> result = await HandleAsync(Guid.CreateVersion7(), Before);

        result.Error.ShouldBe(ExerciseErrors.NotFound);
    }

    [Fact]
    public async Task AMissingDateFailsValidation()
    {
        Result<ExerciseLastTimeResponse> result = await HandleAsync(_id.Value, default);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
    }

    private Task<Result<ExerciseLastTimeResponse>> HandleAsync(Guid id, DateOnly before) =>
        _handler.HandleAsync(new GetExerciseLastTimeRequest(id, before), TestContext.Current.CancellationToken);
}
