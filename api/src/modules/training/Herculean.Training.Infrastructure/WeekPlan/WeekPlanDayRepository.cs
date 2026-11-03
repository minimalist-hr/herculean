using Herculean.Training.Domain.WeekPlan;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.WeekPlan;

internal sealed class WeekPlanDayRepository(TrainingDbContext dbContext) : IWeekPlanDayRepository
{
    public Task<List<WeekPlanDay>> ListAsync(CancellationToken cancellationToken) =>
        dbContext.WeekPlanDays.ToListAsync(cancellationToken);

    public void Add(WeekPlanDay day)
    {
        dbContext.WeekPlanDays.Add(day);
    }
}
