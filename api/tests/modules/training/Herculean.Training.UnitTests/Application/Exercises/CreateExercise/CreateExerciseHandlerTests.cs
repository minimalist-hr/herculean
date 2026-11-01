using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Exercises;
using Herculean.Training.Application.Exercises.CreateExercise;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests.Application.Exercises.CreateExercise;

public sealed class CreateExerciseHandlerTests
{
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeExerciseRepository _exerciseRepository = new();
    private readonly FakeGroupRepository _groupRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly CreateExerciseHandler _handler;
    private readonly IReadOnlyList<Group> _groups;

    public CreateExerciseHandlerTests()
    {
        _groups = Group.CreateStarting(UserId.From(_currentUserAccessor.UserId));
        _groupRepository.AddRange(_groups);
        _handler = new CreateExerciseHandler(new CreateExerciseValidator(), new CurrentUser(_currentUserAccessor), _exerciseRepository, _groupRepository, _unitOfWork);
    }

    private Guid Chest => _groups[0].Id.Value;

    private Guid Back => _groups[1].Id.Value;

    [Fact]
    public async Task AValidExerciseIsSavedForTheCurrentUser()
    {
        Result<ExerciseResponse> result = await HandleAsync(new CreateExerciseRequest("  Pull-up ", Back, [Chest]));

        result.Value.Name.ShouldBe("Pull-up");
        result.Value.GroupId.ShouldBe(Back);
        result.Value.AlsoWorksGroupIds.ShouldBe([Chest]);
        Exercise exercise = _exerciseRepository.Exercises.ShouldHaveSingleItem();
        exercise.UserId.ShouldBe(UserId.From(_currentUserAccessor.UserId));
        result.Value.Id.ShouldBe(exercise.Id.Value);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AlsoWorksIsOptional()
    {
        Result<ExerciseResponse> result = await HandleAsync(new CreateExerciseRequest("Pull-up", Back, null));

        result.Value.AlsoWorksGroupIds.ShouldBeEmpty();
    }

    [Theory]
    [InlineData("Bench press")]
    [InlineData("bench PRESS")]
    [InlineData("  Bench Press ")]
    public async Task ANameTheUserAlreadyHasIsTakenRegardlessOfCase(string name)
    {
        await HandleAsync(new CreateExerciseRequest("Bench press", Chest, null));

        Result<ExerciseResponse> result = await HandleAsync(new CreateExerciseRequest(name, Chest, null));

        result.Error.ShouldBe(ExerciseErrors.NameTaken);
        _exerciseRepository.Exercises.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task TheLastAllowedExerciseIsSaved()
    {
        _exerciseRepository.Count = Exercise.MaxPerUser - 1;

        Result<ExerciseResponse> result = await HandleAsync(new CreateExerciseRequest("Pull-up", Back, null));

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task AtTheLimitNothingIsSaved()
    {
        _exerciseRepository.Count = Exercise.MaxPerUser;

        Result<ExerciseResponse> result = await HandleAsync(new CreateExerciseRequest("Pull-up", Back, null));

        result.Error.ShouldBe(ExerciseErrors.LimitReached);
        result.Error!.Description.ShouldContain("500");
        _exerciseRepository.Exercises.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AGroupTheUserDoesNotHaveIsNotFound()
    {
        Result<ExerciseResponse> result = await HandleAsync(new CreateExerciseRequest("Pull-up", Guid.CreateVersion7(), null));

        result.Error.ShouldBe(GroupErrors.NotFound);
    }

    [Fact]
    public async Task AnAlsoWorksGroupTheUserDoesNotHaveIsNotFound()
    {
        Result<ExerciseResponse> result = await HandleAsync(new CreateExerciseRequest("Pull-up", Back, [Guid.CreateVersion7()]));

        result.Error.ShouldBe(GroupErrors.NotFound);
        _exerciseRepository.Exercises.ShouldBeEmpty();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task ABlankNameFailsWithAFieldError(string name)
    {
        Result<ExerciseResponse> result = await HandleAsync(new CreateExerciseRequest(name, Back, null));

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("name");
    }

    [Fact]
    public async Task ANameOfOneHundredCharactersIsAllowedAndLongerIsNot()
    {
        string longest = new('a', Exercise.NameMaxLength);

        (await HandleAsync(new CreateExerciseRequest(longest, Back, null))).IsSuccess.ShouldBeTrue();
        (await HandleAsync(new CreateExerciseRequest(longest + "a", Back, null))).Error.ShouldNotBeNull().Fields.ShouldContainKey("name");
    }

    [Fact]
    public async Task NoGroupFailsWithAFieldError()
    {
        Result<ExerciseResponse> result = await HandleAsync(new CreateExerciseRequest("Pull-up", Guid.Empty, null));

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("groupId");
    }

    [Fact]
    public async Task AlsoWorksCantIncludeTheExercisesOwnGroup()
    {
        Result<ExerciseResponse> result = await HandleAsync(new CreateExerciseRequest("Pull-up", Back, [Back]));

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("alsoWorksGroupIds");
    }

    [Fact]
    public async Task AlsoWorksCantRepeatAGroup()
    {
        Result<ExerciseResponse> result = await HandleAsync(new CreateExerciseRequest("Pull-up", Back, [Chest, Chest]));

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("alsoWorksGroupIds");
    }

    private Task<Result<ExerciseResponse>> HandleAsync(CreateExerciseRequest request) =>
        _handler.HandleAsync(request, TestContext.Current.CancellationToken);
}
