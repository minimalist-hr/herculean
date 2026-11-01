using FluentValidation;

using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Application.Exercises;

/// <summary>The fields a request sends to create or change an exercise.</summary>
internal interface IExerciseFields
{
    string Name { get; }

    Guid GroupId { get; }

    List<Guid>? AlsoWorksGroupIds { get; }
}

internal static class ExerciseFieldRules
{
    public static void AddExerciseFieldRules<T>(this AbstractValidator<T> validator)
        where T : IExerciseFields
    {
        validator.RuleFor(request => request.Name)
            .Must(name => !string.IsNullOrWhiteSpace(name) && name.Trim().Length <= Exercise.NameMaxLength)
            .WithMessage($"'{{PropertyName}}' must have 1 to {Exercise.NameMaxLength} characters.");
        validator.RuleFor(request => request.GroupId).NotEmpty();
        validator.RuleFor(request => request.AlsoWorksGroupIds)
            .Must((request, groupIds) => groupIds is null || (!groupIds.Contains(request.GroupId) && groupIds.Distinct().Count() == groupIds.Count))
            .WithMessage("'{PropertyName}' can't repeat a group, or include the group the exercise belongs to.");
    }
}
