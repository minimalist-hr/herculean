using Herculean.Training.Application.Routines.GetRoutine;
using Herculean.Training.Application.Routines.ListRoutines;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Application.Routines;

internal interface IRoutineReadRepository
{
    /// <summary>The current user's routines, by their first planned weekday, then name.</summary>
    Task<List<RoutineListItemResponse>> ListAsync(CancellationToken cancellationToken);

    /// <summary>One of the current user's routines, or null if there is none.</summary>
    Task<RoutineDetailsResponse?> GetAsync(RoutineId id, CancellationToken cancellationToken);
}
