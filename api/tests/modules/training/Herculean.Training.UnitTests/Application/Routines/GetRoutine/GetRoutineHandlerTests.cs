using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Routines.GetRoutine;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;

namespace Herculean.Training.UnitTests.Application.Routines.GetRoutine;

public sealed class GetRoutineHandlerTests
{
    private readonly FakeRoutineReadRepository _routineReadRepository = new();
    private readonly GetRoutineHandler _handler;

    public GetRoutineHandlerTests()
    {
        _handler = new GetRoutineHandler(_routineReadRepository);
    }

    [Fact]
    public async Task ARoutineIsReturned()
    {
        RoutineDetailsResponse routine = new(Guid.CreateVersion7(), "Legs", [Weekday.Monday], []);
        _routineReadRepository.Details.Add(routine);

        Result<RoutineDetailsResponse> result = await _handler.HandleAsync(routine.Id, TestContext.Current.CancellationToken);

        result.Value.ShouldBe(routine);
    }

    [Fact]
    public async Task AnUnknownRoutineIsNotFound()
    {
        Result<RoutineDetailsResponse> result = await _handler.HandleAsync(Guid.CreateVersion7(), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(RoutineErrors.NotFound);
    }
}
