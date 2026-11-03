using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Application.Routines.DeleteRoutine;

internal sealed class DeleteRoutineHandler(
    IRoutineRepository routineRepository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        Routine? routine = await routineRepository.GetAsync(RoutineId.From(id), cancellationToken);
        if (routine is null)
        {
            return RoutineErrors.NotFound;
        }

        routine.Delete(timeProvider.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
