using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Application.Routines.RestoreRoutine;

internal sealed class RestoreRoutineHandler(
    IRoutineRepository routineRepository,
    IExerciseRepository exerciseRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<RoutineResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        RoutineId routineId = RoutineId.From(id);
        Routine? routine = await routineRepository.GetDeletedAsync(routineId, cancellationToken);
        if (routine is null)
        {
            return RoutineErrors.NotFound;
        }

        // While it was deleted nothing held its exercises, so they may be gone.
        if (!await exerciseRepository.AllExistAsync([.. routine.Exercises.Select(exercise => exercise.ExerciseId)], cancellationToken))
        {
            return RoutineErrors.ExerciseDeleted;
        }

        if (await routineRepository.NameExistsAsync(routine.Name, routineId, cancellationToken))
        {
            return RoutineErrors.NameTaken;
        }

        routine.Restore();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new RoutineResponse(routine.Id.Value, routine.Name);
    }
}
