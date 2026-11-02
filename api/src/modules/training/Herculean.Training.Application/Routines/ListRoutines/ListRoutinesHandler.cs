namespace Herculean.Training.Application.Routines.ListRoutines;

internal sealed class ListRoutinesHandler(IRoutineReadRepository routineReadRepository)
{
    public Task<List<RoutineListItemResponse>> HandleAsync(CancellationToken cancellationToken) =>
        routineReadRepository.ListAsync(cancellationToken);
}
