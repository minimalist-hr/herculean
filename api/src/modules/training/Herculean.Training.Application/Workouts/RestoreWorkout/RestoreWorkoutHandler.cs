using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.RestoreWorkout;

internal sealed class RestoreWorkoutHandler(
    IWorkoutRepository workoutRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<WorkoutResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        Workout? workout = await workoutRepository.GetDeletedAsync(WorkoutId.From(id), cancellationToken);
        if (workout is null)
        {
            return WorkoutErrors.NotFound;
        }

        if (await workoutRepository.ExistsOnAsync(workout.Date, cancellationToken))
        {
            return WorkoutErrors.DateTaken;
        }

        if (workout.Status == WorkoutStatus.InProgress && await workoutRepository.InProgressExistsAsync(cancellationToken))
        {
            return WorkoutErrors.AnotherInProgress;
        }

        workout.Restore();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new WorkoutResponse(workout.Id.Value, workout.Date, workout.Status, workout.Name);
    }
}
