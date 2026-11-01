using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Exercises.UpdateExercise;

internal sealed class UpdateExerciseHandler(
    IValidator<UpdateExerciseRequest> validator,
    IExerciseRepository exerciseRepository,
    IGroupRepository groupRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<ExerciseResponse>> HandleAsync(Guid id, UpdateExerciseRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        ExerciseId exerciseId = ExerciseId.From(id);
        Exercise? exercise = await exerciseRepository.GetAsync(exerciseId, cancellationToken);
        if (exercise is null)
        {
            return ExerciseErrors.NotFound;
        }

        GroupId groupId = GroupId.From(request.GroupId);
        List<GroupId> alsoWorksGroupIds = [.. (request.AlsoWorksGroupIds ?? []).Select(GroupId.From)];

        List<GroupId> usersGroupIds = await groupRepository.ListIdsAsync(cancellationToken);
        if (!usersGroupIds.Contains(groupId) || !alsoWorksGroupIds.All(usersGroupIds.Contains))
        {
            return GroupErrors.NotFound;
        }

        if (await exerciseRepository.NameExistsAsync(request.Name, exerciseId, cancellationToken))
        {
            return ExerciseErrors.NameTaken;
        }

        exercise.Update(request.Name, groupId, alsoWorksGroupIds);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ExerciseResponse.From(exercise);
    }
}
