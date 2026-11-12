using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Starter;

namespace Herculean.Training.Application.Starter.CreateStarterExercise;

internal sealed class CreateStarterExerciseHandler(
    IValidator<SaveStarterExerciseRequest> validator,
    IStarterExerciseRepository starterExerciseRepository,
    IStarterGroupRepository starterGroupRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<StarterCreatedResponse>> HandleAsync(SaveStarterExerciseRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        StarterGroupId groupId = StarterGroupId.From(request.GroupId);
        List<StarterGroupId> alsoWorksGroupIds = [.. (request.AlsoWorksGroupIds ?? []).Select(StarterGroupId.From)];

        if (!await starterGroupRepository.AllExistAsync([groupId, .. alsoWorksGroupIds], cancellationToken))
        {
            return StarterErrors.GroupNotFound;
        }

        if (await starterExerciseRepository.NameExistsAsync(request.Name, null, cancellationToken))
        {
            return StarterErrors.ExerciseNameTaken;
        }

        if (await starterExerciseRepository.CountAsync(cancellationToken) >= Exercise.MaxPerUser)
        {
            return StarterErrors.ExerciseLimitReached;
        }

        StarterExercise exercise = StarterExercise.Create(request.Name, groupId, alsoWorksGroupIds);
        starterExerciseRepository.Add(exercise);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new StarterCreatedResponse(exercise.Id.Value);
    }
}
