using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Auth;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Application.Routines.CreateRoutine;

internal sealed class CreateRoutineHandler(
    IValidator<CreateRoutineRequest> validator,
    CurrentUser currentUser,
    IRoutineRepository routineRepository,
    IExerciseRepository exerciseRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<RoutineResponse>> HandleAsync(CreateRoutineRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        List<RoutineExerciseValues> exercises = request.ToExerciseValues();
        if (!await exerciseRepository.AllExistAsync([.. exercises.Select(exercise => exercise.ExerciseId)], cancellationToken))
        {
            return ExerciseErrors.NotFound;
        }

        if (await routineRepository.NameExistsAsync(request.Name, null, cancellationToken))
        {
            return RoutineErrors.NameTaken;
        }

        if (await routineRepository.CountAsync(cancellationToken) >= Routine.MaxPerUser)
        {
            return RoutineErrors.LimitReached;
        }

        Routine routine = Routine.Create(currentUser.UserId, request.Name, exercises);
        routineRepository.Add(routine);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new RoutineResponse(routine.Id.Value, routine.Name);
    }
}
