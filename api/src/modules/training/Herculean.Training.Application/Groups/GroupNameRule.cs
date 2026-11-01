using FluentValidation;

using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Groups;

/// <summary>A request that sends a group's name.</summary>
internal interface IGroupName
{
    string Name { get; }
}

internal static class GroupNameRule
{
    public static void AddGroupNameRule<T>(this AbstractValidator<T> validator)
        where T : IGroupName
    {
        validator.RuleFor(request => request.Name)
            .Must(name => !string.IsNullOrWhiteSpace(name) && name.Trim().Length <= Group.NameMaxLength)
            .WithMessage($"'{{PropertyName}}' must have 1 to {Group.NameMaxLength} characters.");
    }
}
