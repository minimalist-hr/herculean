using Herculean.Training.Application.Routines.ListRoutines;

namespace Herculean.Training.Application.Routines;

internal interface IRoutineReadRepository
{
    /// <summary>The current user's routines, by their first planned weekday, then name.</summary>
    Task<List<RoutineListItemResponse>> ListAsync(CancellationToken cancellationToken);
}
