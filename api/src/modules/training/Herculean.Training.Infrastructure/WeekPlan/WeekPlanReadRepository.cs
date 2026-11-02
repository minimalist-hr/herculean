using Herculean.Training.Application.WeekPlan;
using Herculean.Training.Application.WeekPlan.ListWeekPlanDays;

namespace Herculean.Training.Infrastructure.WeekPlan;

internal sealed class WeekPlanReadRepository(TrainingDbContext dbContext) : IWeekPlanReadRepository
{
    public async Task<List<WeekPlanDayResponse>> ListAsync(CancellationToken cancellationToken)
    {
        var plan = await CurrentWeekPlan.ReadAsync(dbContext, cancellationToken);

        return [.. plan.OrderBy(day => day.Key).Select(day => new WeekPlanDayResponse(day.Key, day.Value?.Id, day.Value?.Name))];
    }
}
