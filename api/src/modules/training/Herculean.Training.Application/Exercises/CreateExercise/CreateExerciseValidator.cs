using FluentValidation;

using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Application.Exercises.CreateExercise;

internal sealed class CreateExerciseValidator : AbstractValidator<CreateExerciseRequest>
{
    public CreateExerciseValidator()
    {
        RuleFor(request => request.Name)
            .Must(name => !string.IsNullOrWhiteSpace(name) && name.Trim().Length <= Exercise.NameMaxLength)
            .WithMessage($"'{{PropertyName}}' must have 1 to {Exercise.NameMaxLength} characters.");
        RuleFor(request => request.GroupId).NotEmpty();
        RuleFor(request => request.AlsoWorksGroupIds)
            .Must((request, groupIds) => groupIds is null || (!groupIds.Contains(request.GroupId) && groupIds.Distinct().Count() == groupIds.Count))
            .WithMessage("'{PropertyName}' can't repeat a group, or include the group the exercise belongs to.");
    }
}
