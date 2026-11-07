using Herculean.Training.Application.Exercises.ListExercises;
using Herculean.Training.Application.Groups;
using Herculean.Training.Application.Groups.GetGroup;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Infrastructure.Exercises;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Groups;

internal sealed class GroupReadRepository(TrainingDbContext dbContext) : IGroupReadRepository
{
    public Task<List<GroupListItemResponse>> ListAsync(CancellationToken cancellationToken) =>
        dbContext.Groups
            .AsNoTracking()
            .OrderBy(group => group.Order)
            .ThenBy(group => group.Name)
            .Select(group => new GroupListItemResponse(
                group.Id.Value,
                group.Name,
                dbContext.Exercises.Count(exercise => exercise.GroupId == group.Id || exercise.AlsoWorks.Any(alsoWorks => alsoWorks.GroupId == group.Id))))
            .ToListAsync(cancellationToken);

    public async Task<GroupDetailsResponse?> GetAsync(GroupId id, CancellationToken cancellationToken)
    {
        GroupDetailsResponse? group = await GetWithoutBestSetsAsync(id, cancellationToken);
        return group is null
            ? null
            : group with
            {
                Exercises = await DoneSets.WithBestSetsAsync(dbContext, group.Exercises, cancellationToken),
                AlsoWorksExercises = await DoneSets.WithBestSetsAsync(dbContext, group.AlsoWorksExercises, cancellationToken),
            };
    }

    private Task<GroupDetailsResponse?> GetWithoutBestSetsAsync(GroupId id, CancellationToken cancellationToken) =>
        dbContext.Groups
            .AsNoTracking()
            .Where(group => group.Id == id)
            .Select(group => new GroupDetailsResponse(
                group.Id.Value,
                group.Name,
                dbContext.Exercises
                    .Where(exercise => exercise.GroupId == group.Id)
                    .OrderBy(exercise => exercise.Name)
                    .Select(exercise => new ExerciseListItemResponse(exercise.Id.Value, exercise.Name, exercise.GroupId.Value, exercise.Group.Name, null))
                    .ToList(),
                dbContext.Exercises
                    .Where(exercise => exercise.AlsoWorks.Any(alsoWorks => alsoWorks.GroupId == group.Id))
                    .OrderBy(exercise => exercise.Name)
                    .Select(exercise => new ExerciseListItemResponse(exercise.Id.Value, exercise.Name, exercise.GroupId.Value, exercise.Group.Name, null))
                    .ToList()))
            .SingleOrDefaultAsync(cancellationToken);
}
