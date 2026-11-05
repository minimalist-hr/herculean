using FluentValidation;

using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts;

internal static class SetFieldRules
{
    public static IRuleBuilderOptions<T, decimal> IsSetWeight<T>(this IRuleBuilder<T, decimal> rule) =>
        rule.InclusiveBetween(0, Set.MaxWeightKg).PrecisionScale(Set.WeightPrecision, Set.WeightScale, ignoreTrailingZeros: true);

    public static IRuleBuilderOptions<T, decimal?> IsSetWeight<T>(this IRuleBuilder<T, decimal?> rule) =>
        rule.InclusiveBetween(0, Set.MaxWeightKg).PrecisionScale(Set.WeightPrecision, Set.WeightScale, ignoreTrailingZeros: true);

    public static IRuleBuilderOptions<T, int> IsSetReps<T>(this IRuleBuilder<T, int> rule) =>
        rule.InclusiveBetween(1, Set.MaxReps);

    public static IRuleBuilderOptions<T, int?> IsSetReps<T>(this IRuleBuilder<T, int?> rule) =>
        rule.InclusiveBetween(1, Set.MaxReps);
}
