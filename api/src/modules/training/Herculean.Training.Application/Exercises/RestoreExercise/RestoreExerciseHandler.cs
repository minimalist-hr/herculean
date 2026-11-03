using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Exercises.RestoreExercise;

internal sealed class RestoreExerciseHandler(
    IExerciseRepository exerciseRepository,
    IGroupRepository groupRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<ExerciseResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        ExerciseId exerciseId = ExerciseId.From(id);
        Exercise? exercise = await exerciseRepository.GetDeletedAsync(exerciseId, cancellationToken);
        if (exercise is null)
        {
            return ExerciseErrors.NotFound;
        }

        // While it was deleted nothing held its groups, so they may be gone.
        List<GroupId> usersGroupIds = await groupRepository.ListIdsAsync(cancellationToken);
        if (!usersGroupIds.Contains(exercise.GroupId) || !exercise.AlsoWorks.All(alsoWorks => usersGroupIds.Contains(alsoWorks.GroupId)))
        {
            return GroupErrors.NotFound;
        }

        if (await exerciseRepository.NameExistsAsync(exercise.Name, exerciseId, cancellationToken))
        {
            return ExerciseErrors.NameTaken;
        }

        exercise.Restore();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ExerciseResponse.From(exercise);
    }
}
