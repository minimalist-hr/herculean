using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.UnitTests;

/// <summary>Six groups in order, like the ones a new account starts with, for tests that need a user's groups.</summary>
internal static class TestGroups
{
    public static readonly string[] Names = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs"];

    public static IReadOnlyList<Group> Create(UserId userId) =>
        [.. Names.Select((name, order) => Group.Create(userId, name, order))];
}
