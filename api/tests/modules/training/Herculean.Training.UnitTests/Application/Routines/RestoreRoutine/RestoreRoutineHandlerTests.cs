using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Routines;
using Herculean.Training.Application.Routines.RestoreRoutine;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.UnitTests.Application.Routines.RestoreRoutine;

public sealed class RestoreRoutineHandlerTests
{
    private static readonly UserId User = UserId.From(Guid.CreateVersion7());

    private readonly FakeRoutineRepository _routineRepository = new();
    private readonly FakeExerciseRepository _exerciseRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly RestoreRoutineHandler _handler;
    private readonly Exercise _squat = Exercise.Create(User, "Squat", GroupId.New(), []);
    private readonly Routine _routine;

    public RestoreRoutineHandlerTests()
    {
        _exerciseRepository.Add(_squat);
        _routine = Routine.Create(User, "Legs", [new RoutineExerciseValues(_squat.Id, 3, 8, 10)]);
        _routine.Delete(DateTimeOffset.UnixEpoch);
        _routineRepository.Add(_routine);
        _handler = new RestoreRoutineHandler(_routineRepository, _exerciseRepository, _unitOfWork);
    }

    private static CancellationToken Token => TestContext.Current.CancellationToken;

    [Fact]
    public async Task ADeletedRoutineComesBack()
    {
        Result<RoutineResponse> result = await _handler.HandleAsync(_routine.Id.Value, Token);

        result.Value.Name.ShouldBe("Legs");
        _routine.DeletedAtUtc.ShouldBeNull();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task ARoutineThatIsNotDeletedIsNotFound()
    {
        _routine.Restore();

        Result<RoutineResponse> result = await _handler.HandleAsync(_routine.Id.Value, Token);

        result.Error.ShouldBe(RoutineErrors.NotFound);
    }

    [Fact]
    public async Task ItsNameTakenSinceKeepsItDeleted()
    {
        _routineRepository.Add(Routine.Create(User, "legs", []));

        Result<RoutineResponse> result = await _handler.HandleAsync(_routine.Id.Value, Token);

        result.Error.ShouldBe(RoutineErrors.NameTaken);
        _routine.DeletedAtUtc.ShouldNotBeNull();
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AnExerciseDeletedSinceKeepsItDeleted()
    {
        _squat.Delete(DateTimeOffset.UnixEpoch);

        Result<RoutineResponse> result = await _handler.HandleAsync(_routine.Id.Value, Token);

        result.Error.ShouldBe(RoutineErrors.ExerciseDeleted);
        _routine.DeletedAtUtc.ShouldNotBeNull();
    }
}
