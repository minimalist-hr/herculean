using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.DeleteWorkoutExercise;

internal sealed class DeleteWorkoutExerciseHandler(
    IWorkoutRepository workoutRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, Guid workoutExerciseId, CancellationToken cancellationToken)
    {
        Workout? workout = await workoutRepository.GetWithSetsAsync(WorkoutId.From(id), cancellationToken);
        if (workout is null)
        {
            return WorkoutErrors.NotFound;
        }

        Result result = workout.RemoveExercise(WorkoutExerciseId.From(workoutExerciseId));
        if (!result.IsSuccess)
        {
            return result;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
