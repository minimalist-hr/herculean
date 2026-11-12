using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Exercises;
using Herculean.Training.Application.Exercises.UpdateExercise;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests.Application.Exercises.UpdateExercise;

public sealed class UpdateExerciseHandlerTests
{
    private readonly UserId _userId = UserId.From(Guid.CreateVersion7());
    private readonly FakeExerciseRepository _exerciseRepository = new();
    private readonly FakeGroupRepository _groupRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly UpdateExerciseHandler _handler;
    private readonly IReadOnlyList<Group> _groups;
    private readonly Exercise _exercise;

    public UpdateExerciseHandlerTests()
    {
        _groups = TestGroups.Create(_userId);
        _groupRepository.AddRange(_groups);
        _exercise = Exercise.Create(_userId, "Bench press", _groups[0].Id, [_groups[1].Id]);
        _exerciseRepository.Add(_exercise);
        _handler = new UpdateExerciseHandler(new UpdateExerciseValidator(), _exerciseRepository, _groupRepository, _unitOfWork);
    }

    private Guid Chest => _groups[0].Id.Value;

    private Guid Back => _groups[1].Id.Value;

    private Guid Legs => _groups[5].Id.Value;

    [Fact]
    public async Task AValidChangeIsSaved()
    {
        Result<ExerciseResponse> result = await HandleAsync(new UpdateExerciseRequest("  Squat ", Legs, [Back]));

        result.Value.Id.ShouldBe(_exercise.Id.Value);
        result.Value.Name.ShouldBe("Squat");
        result.Value.GroupId.ShouldBe(Legs);
        result.Value.AlsoWorksGroupIds.ShouldBe([Back]);
        _exercise.Name.ShouldBe("Squat");
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task NoAlsoWorksClearsThem()
    {
        Result<ExerciseResponse> result = await HandleAsync(new UpdateExerciseRequest("Bench press", Chest, null));

        result.Value.AlsoWorksGroupIds.ShouldBeEmpty();
    }

    [Theory]
    [InlineData("Bench press")]
    [InlineData("BENCH PRESS")]
    public async Task ItCanKeepItsOwnNameInAnyCase(string name)
    {
        Result<ExerciseResponse> result = await HandleAsync(new UpdateExerciseRequest(name, Chest, null));

        result.Value.Name.ShouldBe(name);
    }

    [Theory]
    [InlineData("Pull-up")]
    [InlineData("pull-UP")]
    [InlineData("  Pull-up ")]
    public async Task ANameOfAnotherExerciseIsTakenRegardlessOfCase(string name)
    {
        _exerciseRepository.Add(Exercise.Create(_userId, "Pull-up", _groups[1].Id, []));

        Result<ExerciseResponse> result = await HandleAsync(new UpdateExerciseRequest(name, Chest, null));

        result.Error.ShouldBe(ExerciseErrors.NameTaken);
        _exercise.Name.ShouldBe("Bench press");
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task ANameOfADeletedExerciseCanBeUsed()
    {
        Exercise deleted = Exercise.Create(_userId, "Pull-up", _groups[1].Id, []);
        deleted.Delete(DateTimeOffset.UnixEpoch);
        _exerciseRepository.Add(deleted);

        Result<ExerciseResponse> result = await HandleAsync(new UpdateExerciseRequest("Pull-up", Chest, null));

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task AnUnknownExerciseIsNotFound()
    {
        Result<ExerciseResponse> result = await _handler.HandleAsync(
            Guid.CreateVersion7(),
            new UpdateExerciseRequest("Squat", Legs, null),
            TestContext.Current.CancellationToken);

        result.Error.ShouldBe(ExerciseErrors.NotFound);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task ADeletedExerciseIsNotFound()
    {
        _exercise.Delete(DateTimeOffset.UnixEpoch);

        Result<ExerciseResponse> result = await HandleAsync(new UpdateExerciseRequest("Squat", Legs, null));

        result.Error.ShouldBe(ExerciseErrors.NotFound);
    }

    [Fact]
    public async Task AGroupTheUserDoesNotHaveIsNotFound()
    {
        Result<ExerciseResponse> result = await HandleAsync(new UpdateExerciseRequest("Squat", Guid.CreateVersion7(), null));

        result.Error.ShouldBe(GroupErrors.NotFound);
    }

    [Fact]
    public async Task AnAlsoWorksGroupTheUserDoesNotHaveIsNotFound()
    {
        Result<ExerciseResponse> result = await HandleAsync(new UpdateExerciseRequest("Squat", Legs, [Guid.CreateVersion7()]));

        result.Error.ShouldBe(GroupErrors.NotFound);
        _exercise.Name.ShouldBe("Bench press");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task ABlankNameFailsWithAFieldError(string name)
    {
        Result<ExerciseResponse> result = await HandleAsync(new UpdateExerciseRequest(name, Chest, null));

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("name");
    }

    [Fact]
    public async Task AlsoWorksCannotIncludeItsOwnGroup()
    {
        Result<ExerciseResponse> result = await HandleAsync(new UpdateExerciseRequest("Squat", Chest, [Chest]));

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("alsoWorksGroupIds");
    }

    private Task<Result<ExerciseResponse>> HandleAsync(UpdateExerciseRequest request) =>
        _handler.HandleAsync(_exercise.Id.Value, request, TestContext.Current.CancellationToken);
}
