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

        exercise.Delete(timeProvider.GetUtcNow());
        await routineRepository.RemoveExerciseAsync(exercise.Id, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
