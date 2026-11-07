using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Auth;
using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Application.Exercises.GetExerciseProgress;

internal sealed class GetExerciseProgressHandler(
    IValidator<GetExerciseProgressRequest> validator,
    IExerciseReadRepository exerciseReadRepository,
    UserClock userClock)
{
    /// <summary>The most sessions a range shows one by one. Beyond it, each month becomes one point.</summary>
    internal const int MaxSessionPoints = 60;

    public async Task<Result<ExerciseProgressResponse>> HandleAsync(GetExerciseProgressRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        ExerciseId id = ExerciseId.From(request.Id);
        if (!await exerciseReadRepository.ExistsAsync(id, cancellationToken))
        {
            return ExerciseErrors.NotFound;
        }

        DateOnly today = await userClock.GetTodayAsync(cancellationToken);
        List<ProgressPointResponse> sessions = await exerciseReadRepository.ListHeaviestSetsAsync(
            id,
            GetExerciseProgressValidator.FromOf(request.Range, today),
            cancellationToken);

        if (sessions.Count <= MaxSessionPoints)
        {
            return new ExerciseProgressResponse(false, sessions);
        }

        List<ProgressPointResponse> months =
        [
            .. sessions
                .GroupBy(point => (point.Date.Year, point.Date.Month))
                .Select(month => month.OrderByDescending(point => point.WeightKg).ThenByDescending(point => point.Reps).ThenBy(point => point.Date).First()),
        ];

        return new ExerciseProgressResponse(true, months);
    }
}
