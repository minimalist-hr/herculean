namespace Herculean.Training.Application.WeekPlan.ListWeekPlanDays;

internal sealed class ListWeekPlanDaysHandler(IWeekPlanReadRepository weekPlanReadRepository)
{
    public Task<List<WeekPlanDayResponse>> HandleAsync(CancellationToken cancellationToken) =>
        weekPlanReadRepository.ListAsync(cancellationToken);
}
