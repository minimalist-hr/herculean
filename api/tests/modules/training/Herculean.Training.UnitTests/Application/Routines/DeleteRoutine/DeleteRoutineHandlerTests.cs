using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Routines.DeleteRoutine;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.UnitTests.Application.Routines.DeleteRoutine;

public sealed class DeleteRoutineHandlerTests
{
    private readonly FakeRoutineRepository _routineRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly DeleteRoutineHandler _handler;
    private readonly Routine _routine = Routine.Create(UserId.From(Guid.CreateVersion7()), "Legs", []);

    public DeleteRoutineHandlerTests()
    {
        _routineRepository.Add(_routine);
        _handler = new DeleteRoutineHandler(_routineRepository, _unitOfWork, TimeProvider.System);
    }

    [Fact]
    public async Task TheRoutineIsMarkedDeleted()
    {
        Result result = await _handler.HandleAsync(_routine.Id.Value, TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
        _routine.DeletedAtUtc.ShouldNotBeNull();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AnUnknownRoutineIsNotFound()
    {
        Result result = await _handler.HandleAsync(Guid.CreateVersion7(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(RoutineErrors.NotFound);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task ARoutineAlreadyDeletedIsNotFound()
    {
        await _handler.HandleAsync(_routine.Id.Value, TestContext.Current.CancellationToken);

        Result result = await _handler.HandleAsync(_routine.Id.Value, TestContext.Current.CancellationToken);

        result.Error.ShouldBe(RoutineErrors.NotFound);
    }
}
