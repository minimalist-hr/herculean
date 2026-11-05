using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Days;
using Herculean.Training.Application.Days.GetDay;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.CreateWorkout;

internal sealed class CreateWorkoutHandler(
    IValidator<CreateWorkoutRequest> validator,
    IWorkoutRepository workoutRepository,
    IWorkoutReadRepository workoutReadRepository,
    IDayReadRepository dayReadRepository,
    UserClock userClock,
    CurrentUser currentUser,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider)
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

        Result<Workout> workout = request.Status == WorkoutStatus.InProgress
            ? await StartAsync(request.Date, routineId, name, calendar, cancellationToken)
            : await SkipAsync(request.Date, routineId, name, cancellationToken);
        if (!workout.IsSuccess)
        {
            return workout.Error;
        }

        workoutRepository.Add(workout.Value);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new WorkoutResponse(workout.Value.Id.Value, workout.Value.Date, workout.Value.Status, workout.Value.Name);
    }

    private async Task<Result<Workout>> StartAsync(DateOnly date, RoutineId routineId, string name, UserCalendar calendar, CancellationToken cancellationToken)
    {
        if (await workoutRepository.InProgressExistsAsync(cancellationToken))
        {
            return WorkoutErrors.AnotherInProgress;
        }

        List<RoutineExerciseValues> exercises = await workoutReadRepository.ListRoutineExercisesAsync(routineId, cancellationToken);
        if (exercises.Count == 0)
        {
            return WorkoutErrors.NoExercises;
        }

        Dictionary<ExerciseId, LastTimeResponse> lastTime = await workoutReadRepository.ListLastTimeAsync([.. exercises.Select(exercise => exercise.ExerciseId)], date, cancellationToken);

        return Workout.Start(
            currentUser.UserId,
            date,
            routineId,
            name,
            exercises,
            lastTime.ToSetValues(),
            date == calendar.Today ? timeProvider.GetUtcNow() : null);
    }

    private async Task<Result<Workout>> SkipAsync(DateOnly date, RoutineId routineId, string name, CancellationToken cancellationToken)
    {
        List<DayExerciseResponse> exercises = await dayReadRepository.ListExercisesAsync(routineId, cancellationToken);

        return Workout.Skip(
            currentUser.UserId,
            date,
            routineId,
            name,
            exercises.Select(exercise => new RoutineExerciseValues(ExerciseId.From(exercise.ExerciseId), exercise.TargetSets, exercise.TargetRepsFrom, exercise.TargetRepsTo)));
    }
}
