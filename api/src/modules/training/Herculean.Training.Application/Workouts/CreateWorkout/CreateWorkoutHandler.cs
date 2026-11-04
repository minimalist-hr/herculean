using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Days;
using Herculean.Training.Application.Days.GetDay;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.CreateWorkout;

internal sealed class CreateWorkoutHandler(
    IValidator<CreateWorkoutRequest> validator,
    IWorkoutRepository workoutRepository,
    IDayReadRepository dayReadRepository,
    UserClock userClock,
    CurrentUser currentUser,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<WorkoutResponse>> HandleAsync(CreateWorkoutRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        UserCalendar calendar = await userClock.GetCalendarAsync(cancellationToken);
        if (request.Date > calendar.Today)
        {
            return WorkoutErrors.DateInTheFuture;
        }

        if (await workoutRepository.ExistsOnAsync(request.Date, cancellationToken))
        {
            return WorkoutErrors.DateTaken;
        }

        List<PlanChange> changes = await dayReadRepository.ListPlanChangesAsync(cancellationToken);
        if (new DayPlan(changes, calendar).RoutineOn(request.Date) is not { RoutineId: RoutineId routineId, RoutineName: string name })
        {
            return WorkoutErrors.NothingPlanned;
        }

        List<DayExerciseResponse> exercises = await dayReadRepository.ListExercisesAsync(routineId, cancellationToken);
        Workout workout = Workout.Skip(
            currentUser.UserId,
            request.Date,
            routineId,
            name,
            exercises.Select(exercise => new RoutineExerciseValues(ExerciseId.From(exercise.ExerciseId), exercise.TargetSets, exercise.TargetRepsFrom, exercise.TargetRepsTo)));
        workoutRepository.Add(workout);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new WorkoutResponse(workout.Id.Value, workout.Date, workout.Status, workout.Name);
    }
}
