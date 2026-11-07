using System.Globalization;

using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Application.Exercises.ListExerciseSessions;

internal sealed class ListExerciseSessionsHandler(
    IValidator<ListExerciseSessionsRequest> validator,
    IExerciseReadRepository exerciseReadRepository)
{
    internal const int PageSize = 20;

    public async Task<Result<ExerciseSessionsResponse>> HandleAsync(ListExerciseSessionsRequest request, CancellationToken cancellationToken)
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

        DateOnly? before = request.Cursor is string cursor && ListExerciseSessionsValidator.TryParseCursor(cursor, out DateOnly date) ? date : null;

        // One more than a page shows whether there is a next one.
        List<ExerciseSessionResponse> sessions = await exerciseReadRepository.ListSessionsAsync(id, before, PageSize + 1, cancellationToken);
        bool more = sessions.Count > PageSize;
        List<ExerciseSessionResponse> page = [.. sessions.Take(PageSize)];

        if (page.Count == 0)
        {
            return new ExerciseSessionsResponse([], [], null);
        }

        DateOnly newest = page[0].Date;
        DateOnly oldest = page[^1].Date;
        List<SessionMonthResponse> months = await exerciseReadRepository.ListSessionMonthsAsync(
            id,
            new DateOnly(oldest.Year, oldest.Month, 1),
            new DateOnly(newest.Year, newest.Month, 1).AddMonths(1).AddDays(-1),
            cancellationToken);

        return new ExerciseSessionsResponse(
            page,
            months,
            more ? oldest.ToString(ListExerciseSessionsValidator.CursorFormat, CultureInfo.InvariantCulture) : null);
    }
}
