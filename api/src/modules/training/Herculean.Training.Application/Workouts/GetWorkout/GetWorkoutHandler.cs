using Herculean.SharedKernel.Results;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.GetWorkout;

internal sealed class GetWorkoutHandler(IWorkoutReadRepository workoutReadRepository)
{
    public async Task<Result<WorkoutDetailsResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        WorkoutDetailsResponse? workout = await workoutReadRepository.GetAsync(WorkoutId.From(id), cancellationToken);

        return workout is null ? WorkoutErrors.NotFound : workout;
    }
}
