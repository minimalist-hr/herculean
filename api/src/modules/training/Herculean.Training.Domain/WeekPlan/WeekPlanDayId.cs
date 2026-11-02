using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.WeekPlan;

internal readonly record struct WeekPlanDayId(Guid Value) : ITypedId<WeekPlanDayId>
{
    public static WeekPlanDayId New() => new(Guid.CreateVersion7());

    public static WeekPlanDayId From(Guid value) => new(value);
}
