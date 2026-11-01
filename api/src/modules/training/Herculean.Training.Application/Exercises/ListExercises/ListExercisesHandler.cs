using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Exercises.ListExercises;

internal sealed class ListExercisesHandler(
    IValidator<ListExercisesRequest> validator,
    IExerciseReadRepository exerciseReadRepository)
{
    public async Task<Result<List<ExerciseListItemResponse>>> HandleAsync(ListExercisesRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        GroupId? groupId = request.GroupId is Guid id ? GroupId.From(id) : null;
        string? search = string.IsNullOrWhiteSpace(request.Search) ? null : request.Search.Trim();

        return await exerciseReadRepository.ListAsync(search, groupId, cancellationToken);
    }
}
