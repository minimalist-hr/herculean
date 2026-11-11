using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.SwapWorkoutExercise;

internal sealed class SwapWorkoutExerciseHandler(
    IValidator<SwapWorkoutExerciseRequest> validator,
    IWorkoutRepository workoutRepository,
    IWorkoutReadRepository workoutReadRepository,
    IExerciseRepository exerciseRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<WorkoutDetailsResponse>> HandleAsync(Guid id, Guid workoutExerciseId, SwapWorkoutExerciseRequest request, CancellationToken cancellationToken)
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

        ExerciseId exerciseId = ExerciseId.From(request.ExerciseId);
        if (!await exerciseRepository.AllExistAsync([exerciseId], cancellationToken))
        {
            return ExerciseErrors.NotFound;
        }

        WorkoutExerciseId target = WorkoutExerciseId.From(workoutExerciseId);
        Result swapped;
        if (request.Sets is List<SwappedSet> sets)
        {
            swapped = workout.SwapExerciseBack(target, exerciseId, [.. sets.Select(set => new SetValues(set.WeightKg, set.Reps))], request.LengthenedPartials);
        }
        else
        {
            Dictionary<ExerciseId, List<SetValues>> lastTime = (await workoutReadRepository.ListLastTimeAsync([exerciseId], workout.Date, cancellationToken)).ToSetValues();
            swapped = workout.SwapExercise(target, exerciseId, lastTime.GetValueOrDefault(exerciseId) ?? []);
        }

        if (!swapped.IsSuccess)
        {
            return swapped.Error;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return (await workoutReadRepository.GetAsync(workout.Id, cancellationToken))!;
    }
}
