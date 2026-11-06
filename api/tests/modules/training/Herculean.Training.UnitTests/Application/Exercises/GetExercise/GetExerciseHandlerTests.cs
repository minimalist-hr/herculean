using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Exercises.GetExercise;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.UnitTests.Application.Exercises.GetExercise;

public sealed class GetExerciseHandlerTests
{
    private readonly FakeExerciseReadRepository _exerciseReadRepository = new();
    private readonly GetExerciseHandler _handler;

    public GetExerciseHandlerTests()
    {
        _handler = new GetExerciseHandler(_exerciseReadRepository);
    }

    [Fact]
    public async Task ReadsTheExercise()
    {
        ExerciseDetailsResponse exercise = new(Guid.CreateVersion7(), "Bench press", new GroupResponse(Guid.CreateVersion7(), "Chest"), [], [], null, 0, null);
        _exerciseReadRepository.Details.Add(exercise);

        Result<ExerciseDetailsResponse> result = await _handler.HandleAsync(exercise.Id, TestContext.Current.CancellationToken);

        result.Value.ShouldBe(exercise);
    }

    [Fact]
    public async Task AnUnknownExerciseFailsAsNotFound()
    {
        Result<ExerciseDetailsResponse> result = await _handler.HandleAsync(Guid.CreateVersion7(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(ExerciseErrors.NotFound);
    }
}
