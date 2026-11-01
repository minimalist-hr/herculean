using System.ComponentModel;

namespace Herculean.Training.Application.Groups.RenameGroup;

[Description("A group's new name.")]
internal sealed record RenameGroupRequest(
    [property: Description("The name, 1 to 30 characters. Spaces around it are removed. It must differ from the user's other groups, regardless of case.")] string Name) : IGroupName;
