namespace Herculean.Training.Domain.WeekPlan;

internal interface IWeekPlanDayRepository
{
    /// <summary>Every change to the current user's week plan.</summary>
    Task<List<WeekPlanDay>> ListAsync(CancellationToken cancellationToken);

    void Add(WeekPlanDay day);
}
