using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Application.Exercises.DeleteExercise;

internal sealed class DeleteExerciseHandler(
    IExerciseRepository exerciseRepository,
    IRoutineRepository routineRepository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        Exercise? exercise = await exerciseRepository.GetAsync(ExerciseId.From(id), cancellationToken);
        if (exercise is null)
        {
            return ExerciseErrors.NotFound;
        }

        if (await routineRepository.UsesExerciseAsync(exercise.Id, cancellationToken))
        {
            return ExerciseErrors.InRoutine;
        }

        exercise.Delete(timeProvider.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
