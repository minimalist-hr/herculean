using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Starter;

namespace Herculean.Training.Application.Starter.DeleteStarterExercise;

internal sealed class DeleteStarterExerciseHandler(IStarterExerciseRepository starterExerciseRepository, IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        StarterExercise? exercise = await starterExerciseRepository.GetAsync(StarterExerciseId.From(id), cancellationToken);
        if (exercise is null)
        {
            return StarterErrors.ExerciseNotFound;
        }

        starterExerciseRepository.Remove(exercise);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
