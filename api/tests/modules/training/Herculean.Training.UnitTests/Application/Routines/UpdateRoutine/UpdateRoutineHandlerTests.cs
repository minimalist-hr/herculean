using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Routines;
using Herculean.Training.Application.Routines.UpdateRoutine;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.UnitTests.Application.Routines.UpdateRoutine;

public sealed class UpdateRoutineHandlerTests
{
    private readonly UserId _userId = UserId.From(Guid.CreateVersion7());
    private readonly FakeExerciseRepository _exerciseRepository = new();
    private readonly FakeRoutineRepository _routineRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly UpdateRoutineHandler _handler;
    private readonly Exercise _squat;
    private readonly Exercise _lunge;
    private readonly Exercise _press;
    private readonly Routine _routine;

    public UpdateRoutineHandlerTests()
    {
        _squat = AddExercise("Squat");
        _lunge = AddExercise("Lunge");
        _press = AddExercise("Press");
        _routine = Routine.Create(_userId, "Legs", [new RoutineExerciseValues(_squat.Id, 3, 8, 10), new RoutineExerciseValues(_lunge.Id, 3, 8, 10)]);
        _routineRepository.Add(_routine);
        _handler = new UpdateRoutineHandler(new UpdateRoutineValidator(), _routineRepository, _exerciseRepository, _unitOfWork);
    }

    [Fact]
    public async Task TheNameExercisesOrderAndTargetsAreReplaced()
    {
        RoutineExerciseId keptRow = _routine.Exercises[1].Id;

        Result<RoutineResponse> result = await HandleAsync(
            _routine.Id.Value,
            " Lower body ",
            new RoutineExerciseItem(_press.Id.Value, 2, 5, 5),
            new RoutineExerciseItem(_lunge.Id.Value, 4, 6, 8));

        result.Value.Name.ShouldBe("Lower body");
        _routine.NormalizedName.ShouldBe("lower body");
        _routine.Exercises.Select(exercise => exercise.ExerciseId).ShouldBe([_press.Id, _lunge.Id]);
        _routine.Exercises.Select(exercise => exercise.Order).ShouldBe([0, 1]);
        _routine.Exercises[1].Id.ShouldBe(keptRow);
        _routine.Exercises[1].TargetSets.ShouldBe(4);
        _routine.Exercises[1].TargetRepsFrom.ShouldBe(6);
        _routine.Exercises[1].TargetRepsTo.ShouldBe(8);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task ARoutineCanKeepItsOwnName()
    {
        Result<RoutineResponse> result = await HandleAsync(_routine.Id.Value, "LEGS", new RoutineExerciseItem(_squat.Id.Value, 3, 8, 10));

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task ANameAnotherRoutineHasIsTaken()
    {
        _routineRepository.Add(Routine.Create(_userId, "Arms", []));

        Result<RoutineResponse> result = await HandleAsync(_routine.Id.Value, "arms", new RoutineExerciseItem(_squat.Id.Value, 3, 8, 10));

        result.Error.ShouldBe(RoutineErrors.NameTaken);
        _routine.Name.ShouldBe("Legs");
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AnUnknownRoutineIsNotFound()
    {
        Result<RoutineResponse> result = await HandleAsync(Guid.CreateVersion7(), "Legs", new RoutineExerciseItem(_squat.Id.Value, 3, 8, 10));

        result.Error.ShouldBe(RoutineErrors.NotFound);
    }

    [Fact]
    public async Task AnUnknownExerciseIsNotFound()
    {
        Result<RoutineResponse> result = await HandleAsync(_routine.Id.Value, "Legs", new RoutineExerciseItem(Guid.CreateVersion7(), 3, 8, 10));

        result.Error.ShouldBe(ExerciseErrors.NotFound);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task NoExercisesIsNotValid()
    {
        Result<RoutineResponse> result = await HandleAsync(_routine.Id.Value, "Legs");

        result.IsSuccess.ShouldBeFalse();
        _routine.Exercises.Count.ShouldBe(2);
    }

    private Exercise AddExercise(string name)
    {
        Exercise exercise = Exercise.Create(_userId, name, GroupId.New(), []);
        _exerciseRepository.Add(exercise);

        return exercise;
    }

    private Task<Result<RoutineResponse>> HandleAsync(Guid id, string name, params RoutineExerciseItem[] exercises) =>
        _handler.HandleAsync(id, new UpdateRoutineRequest(name, [.. exercises]), TestContext.Current.CancellationToken);
}
