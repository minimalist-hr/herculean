using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.DeleteWorkout;

internal sealed class DeleteWorkoutHandler(
    IWorkoutRepository workoutRepository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        Workout? workout = await workoutRepository.GetAsync(WorkoutId.From(id), cancellationToken);
        if (workout is null)
        {
            return WorkoutErrors.NotFound;
        }

        workout.Delete(timeProvider.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
