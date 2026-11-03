using Herculean.SharedKernel.Results;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Application.Routines.GetRoutine;

internal sealed class GetRoutineHandler(IRoutineReadRepository routineReadRepository)
{
    public async Task<Result<RoutineDetailsResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        RoutineDetailsResponse? routine = await routineReadRepository.GetAsync(RoutineId.From(id), cancellationToken);

        return routine is null ? RoutineErrors.NotFound : routine;
    }
}
