using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.UpdateWorkout;

internal sealed class UpdateWorkoutHandler(
    IValidator<UpdateWorkoutRequest> validator,
    IWorkoutRepository workoutRepository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider)
{
    public async Task<Result<WorkoutResponse>> HandleAsync(Guid id, UpdateWorkoutRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        Workout? workout = await workoutRepository.GetWithSetsAsync(WorkoutId.From(id), cancellationToken);
        if (workout is null)
        {
            return WorkoutErrors.NotFound;
        }

        Result finished = workout.Finish(timeProvider.GetUtcNow(), request.DurationMinutes);
        if (!finished.IsSuccess)
        {
            return finished.Error;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new WorkoutResponse(workout.Id.Value, workout.Date, workout.Status, workout.Name);
    }
}
