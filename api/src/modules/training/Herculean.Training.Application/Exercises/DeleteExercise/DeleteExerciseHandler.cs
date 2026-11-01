using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Application.Exercises.DeleteExercise;

internal sealed class DeleteExerciseHandler(
    IExerciseRepository exerciseRepository,
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
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
