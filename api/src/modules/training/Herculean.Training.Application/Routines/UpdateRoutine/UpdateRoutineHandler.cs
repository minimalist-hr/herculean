using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Application.Auth;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;

namespace Herculean.Training.Application.Routines.UpdateRoutine;

internal sealed class UpdateRoutineHandler(
    IValidator<UpdateRoutineRequest> validator,
    IRoutineRepository routineRepository,
    IExerciseRepository exerciseRepository,
    IRoutineReadRepository routineReadRepository,
    WeekPlanner weekPlanner,
    UserClock userClock,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<RoutineSavedResponse>> HandleAsync(Guid id, UpdateRoutineRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        RoutineId routineId = RoutineId.From(id);
        Routine? routine = await routineRepository.GetAsync(routineId, cancellationToken);
        if (routine is null)
        {
            return RoutineErrors.NotFound;
        }

        List<RoutineExerciseValues> exercises = request.ToExerciseValues();
        if (!await exerciseRepository.AllExistAsync([.. exercises.Select(exercise => exercise.ExerciseId)], cancellationToken))
        {
            return ExerciseErrors.NotFound;
        }

        if (await routineRepository.NameExistsAsync(request.Name, routineId, cancellationToken))
        {
            return RoutineErrors.NameTaken;
        }

        routine.Update(request.Name, exercises);
        DateOnly today = await userClock.GetTodayAsync(cancellationToken);
        List<MovedDay> movedDays = await weekPlanner.PlanRoutineAsync(routine, request.Weekdays, today, cancellationToken);
        Dictionary<RoutineId, string> names = await routineReadRepository.ListNamesAsync(cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return RoutineSavedResponse.From(routine, movedDays, names);
    }
}
