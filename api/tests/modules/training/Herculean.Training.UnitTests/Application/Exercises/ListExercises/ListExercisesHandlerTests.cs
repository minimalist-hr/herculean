using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Exercises.ListExercises;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests.Application.Exercises.ListExercises;

public sealed class ListExercisesHandlerTests
{
    private readonly FakeExerciseReadRepository _exerciseReadRepository = new();
    private readonly ListExercisesHandler _handler;

    public ListExercisesHandlerTests()
    {
        _handler = new ListExercisesHandler(new ListExercisesValidator(), _exerciseReadRepository);
    }

    [Fact]
    public async Task ReadsTheExercises()
    {
        ExerciseListItemResponse exercise = new(Guid.CreateVersion7(), "Pull-up", Guid.CreateVersion7(), "Back", null);
        _exerciseReadRepository.Exercises.Add(exercise);

        Result<List<ExerciseListItemResponse>> result = await _handler.HandleAsync(new ListExercisesRequest(null, null), TestContext.Current.CancellationToken);

        result.Value.ShouldHaveSingleItem().ShouldBe(exercise);
    }

    [Fact]
    public async Task PassesOnTheTrimmedSearchAndTheGroup()
    {
        Guid groupId = Guid.CreateVersion7();

        await _handler.HandleAsync(new ListExercisesRequest("  bench ", groupId), TestContext.Current.CancellationToken);

        _exerciseReadRepository.Search.ShouldBe("bench");
        _exerciseReadRepository.GroupId.ShouldBe(GroupId.From(groupId));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task ABlankSearchFindsEveryName(string? search)
    {
        await _handler.HandleAsync(new ListExercisesRequest(search, null), TestContext.Current.CancellationToken);

        _exerciseReadRepository.Search.ShouldBeNull();
        _exerciseReadRepository.GroupId.ShouldBeNull();
    }

    [Fact]
    public async Task ATooLongSearchFailsWithAFieldError()
    {
        Result<List<ExerciseListItemResponse>> result = await _handler.HandleAsync(
            new ListExercisesRequest(new string('a', ListExercisesValidator.SearchMaxLength + 1), null),
            TestContext.Current.CancellationToken);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
        result.Error.Fields.ShouldContainKey("search");
    }
}
