using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Starter;

namespace Herculean.Training.Application.Starter.UpdateStarterExercise;

internal sealed class UpdateStarterExerciseHandler(
    IValidator<SaveStarterExerciseRequest> validator,
    IStarterExerciseRepository starterExerciseRepository,
    IStarterGroupRepository starterGroupRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, SaveStarterExerciseRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        StarterExercise? exercise = await starterExerciseRepository.GetAsync(StarterExerciseId.From(id), cancellationToken);
        if (exercise is null)
        {
            return StarterErrors.ExerciseNotFound;
        }

        StarterGroupId groupId = StarterGroupId.From(request.GroupId);
        List<StarterGroupId> alsoWorksGroupIds = [.. (request.AlsoWorksGroupIds ?? []).Select(StarterGroupId.From)];

        if (!await starterGroupRepository.AllExistAsync([groupId, .. alsoWorksGroupIds], cancellationToken))
        {
            return StarterErrors.GroupNotFound;
        }

        if (await starterExerciseRepository.NameExistsAsync(request.Name, exercise.Id, cancellationToken))
        {
            return StarterErrors.ExerciseNameTaken;
        }

        exercise.Update(request.Name, groupId, alsoWorksGroupIds);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
