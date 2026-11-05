using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.DeleteSet;

internal sealed class DeleteSetHandler(
    IWorkoutRepository workoutRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, Guid workoutExerciseId, Guid setId, CancellationToken cancellationToken)
    {
        Workout? workout = await workoutRepository.GetWithSetsAsync(WorkoutId.From(id), cancellationToken);
        if (workout is null)
        {
            return WorkoutErrors.NotFound;
        }

        Result result = workout.DeleteSet(WorkoutExerciseId.From(workoutExerciseId), SetId.From(setId));
        if (!result.IsSuccess)
        {
            return result;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
