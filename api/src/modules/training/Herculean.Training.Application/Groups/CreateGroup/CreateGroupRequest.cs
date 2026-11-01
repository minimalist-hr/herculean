using System.ComponentModel;

namespace Herculean.Training.Application.Groups.CreateGroup;

[Description("A new group.")]
internal sealed record CreateGroupRequest(
    [property: Description("The name, 1 to 30 characters. Spaces around it are removed. It must differ from the user's other groups, regardless of case.")] string Name) : IGroupName;
