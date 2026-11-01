using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Auth;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Exercises.CreateExercise;

internal sealed class CreateExerciseHandler(
    IValidator<CreateExerciseRequest> validator,
    CurrentUser currentUser,
    IExerciseRepository exerciseRepository,
    IGroupRepository groupRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<ExerciseResponse>> HandleAsync(CreateExerciseRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        GroupId groupId = GroupId.From(request.GroupId);
        List<GroupId> alsoWorksGroupIds = [.. (request.AlsoWorksGroupIds ?? []).Select(GroupId.From)];

        List<GroupId> usersGroupIds = await groupRepository.ListIdsAsync(cancellationToken);
        if (!usersGroupIds.Contains(groupId) || !alsoWorksGroupIds.All(usersGroupIds.Contains))
        {
            return GroupErrors.NotFound;
        }

        if (await exerciseRepository.NameExistsAsync(request.Name, cancellationToken))
        {
            return ExerciseErrors.NameTaken;
        }

        if (await exerciseRepository.CountAsync(cancellationToken) >= Exercise.MaxPerUser)
        {
            return ExerciseErrors.LimitReached;
        }

        Exercise exercise = Exercise.Create(currentUser.UserId, request.Name, groupId, alsoWorksGroupIds);
        exerciseRepository.Add(exercise);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ExerciseResponse.From(exercise);
    }
}
