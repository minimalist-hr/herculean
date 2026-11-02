using Herculean.Training.Application.WeekPlan.ListWeekPlanDays;

namespace Herculean.Training.Application.WeekPlan;

internal interface IWeekPlanReadRepository
{
    /// <summary>What each weekday holds now, from Monday. A weekday with nothing planned is a rest day.</summary>
    Task<List<WeekPlanDayResponse>> ListAsync(CancellationToken cancellationToken);
}
