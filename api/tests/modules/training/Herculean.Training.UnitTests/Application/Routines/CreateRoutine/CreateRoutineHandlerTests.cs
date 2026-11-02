using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Routines;
using Herculean.Training.Application.Routines.CreateRoutine;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.UnitTests.Application.Routines.CreateRoutine;

public sealed class CreateRoutineHandlerTests
{
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeExerciseRepository _exerciseRepository = new();
    private readonly FakeRoutineRepository _routineRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly CreateRoutineHandler _handler;
    private readonly Exercise _squat;
    private readonly Exercise _lunge;

    public CreateRoutineHandlerTests()
    {
        UserId userId = UserId.From(_currentUserAccessor.UserId);
        _squat = Exercise.Create(userId, "Squat", GroupId.New(), []);
        _lunge = Exercise.Create(userId, "Lunge", GroupId.New(), []);
        _exerciseRepository.Add(_squat);
        _exerciseRepository.Add(_lunge);
        _handler = new CreateRoutineHandler(new CreateRoutineValidator(), new CurrentUser(_currentUserAccessor), _routineRepository, _exerciseRepository, _unitOfWork);
    }

    private RoutineExerciseItem Squat => new(_squat.Id.Value, 3, 8, 10);

    private RoutineExerciseItem Lunge => new(_lunge.Id.Value, 4, 6, 6);

    [Fact]
    public async Task AValidRoutineIsSavedWithItsExercisesInOrder()
    {
        Result<RoutineResponse> result = await HandleAsync("  Legs ", Lunge, Squat);

        result.Value.Name.ShouldBe("Legs");
        Routine routine = _routineRepository.Routines.ShouldHaveSingleItem();
        result.Value.Id.ShouldBe(routine.Id.Value);
        routine.UserId.Value.ShouldBe(_currentUserAccessor.UserId);
        routine.NormalizedName.ShouldBe("legs");
        routine.Exercises.Select(exercise => exercise.ExerciseId).ShouldBe([_lunge.Id, _squat.Id]);
        routine.Exercises.Select(exercise => exercise.Order).ShouldBe([0, 1]);
        routine.Exercises[0].TargetSets.ShouldBe(4);
        routine.Exercises[0].TargetRepsFrom.ShouldBe(6);
        routine.Exercises[0].TargetRepsTo.ShouldBe(6);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Theory]
    [InlineData("Legs")]
    [InlineData("LEGS")]
    [InlineData("  legs ")]
    public async Task ANameTheUserAlreadyHasIsTakenInAnyCase(string name)
    {
        await HandleAsync("Legs", Squat);

        Result<RoutineResponse> result = await HandleAsync(name, Squat);

        result.Error.ShouldBe(RoutineErrors.NameTaken);
        _routineRepository.Routines.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task AtTheLimitNothingIsSaved()
    {
        _routineRepository.Count = Routine.MaxPerUser;

        Result<RoutineResponse> result = await HandleAsync("Legs", Squat);

        result.Error.ShouldBe(RoutineErrors.LimitReached);
        result.Error!.Description.ShouldContain("50");
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AnExerciseTheUserDoesNotHaveIsNotFound()
    {
        Result<RoutineResponse> result = await HandleAsync("Legs", Squat, new RoutineExerciseItem(Guid.CreateVersion7(), 3, 8, 10));

        result.Error.ShouldBe(ExerciseErrors.NotFound);
        _routineRepository.Routines.ShouldBeEmpty();
    }

    [Fact]
    public async Task ADeletedExerciseIsNotFound()
    {
        _lunge.Delete(DateTimeOffset.UnixEpoch);

        Result<RoutineResponse> result = await HandleAsync("Legs", Lunge);

        result.Error.ShouldBe(ExerciseErrors.NotFound);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task ABlankNameFailsWithAFieldError(string name)
    {
        Result<RoutineResponse> result = await HandleAsync(name, Squat);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("name");
    }

    [Fact]
    public async Task ANameOfOneHundredCharactersIsAllowedAndLongerIsNot()
    {
        string longest = new('a', Routine.NameMaxLength);

        (await HandleAsync(longest, Squat)).IsSuccess.ShouldBeTrue();
        (await HandleAsync(longest + "a", Squat)).Error.ShouldNotBeNull().Fields.ShouldContainKey("name");
    }

    [Fact]
    public async Task ARoutineNeedsAnExercise()
    {
        Result<RoutineResponse> result = await HandleAsync("Legs");

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("exercises");
    }

    [Fact]
    public async Task AnExerciseCanOnlyBeInARoutineOnce()
    {
        Result<RoutineResponse> result = await HandleAsync("Legs", Squat, Squat);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("exercises");
    }

    [Fact]
    public async Task ARoutineHasAtMostThirtyExercises()
    {
        RoutineExerciseItem[] exercises = [.. Enumerable.Range(0, Routine.MaxExercises + 1).Select(_ => new RoutineExerciseItem(Guid.CreateVersion7(), 3, 8, 10))];

        Result<RoutineResponse> result = await HandleAsync("Legs", exercises);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("exercises");
    }

    [Theory]
    [InlineData(0, 8, 10)]
    [InlineData(21, 8, 10)]
    [InlineData(3, 0, 10)]
    [InlineData(3, 8, 101)]
    [InlineData(3, 10, 8)]
    public async Task TargetsOutOfRangeFail(int sets, int repsFrom, int repsTo)
    {
        Result<RoutineResponse> result = await HandleAsync("Legs", new RoutineExerciseItem(_squat.Id.Value, sets, repsFrom, repsTo));

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
    }

    [Theory]
    [InlineData(1, 1, 1)]
    [InlineData(20, 100, 100)]
    public async Task TargetsAtTheirLimitsAreAllowed(int sets, int repsFrom, int repsTo)
    {
        Result<RoutineResponse> result = await HandleAsync("Legs", new RoutineExerciseItem(_squat.Id.Value, sets, repsFrom, repsTo));

        result.IsSuccess.ShouldBeTrue();
    }

    private Task<Result<RoutineResponse>> HandleAsync(string name, params RoutineExerciseItem[] exercises) =>
        _handler.HandleAsync(new CreateRoutineRequest(name, [.. exercises]), TestContext.Current.CancellationToken);
}
