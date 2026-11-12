using System.ComponentModel;

using Herculean.Training.Application.Groups;

namespace Herculean.Training.Application.Starter;

[Description("A starter group's name.")]
internal sealed record SaveStarterGroupRequest(
    [property: Description("The name, 1 to 30 characters. Spaces around it are removed. It must differ from the other starter groups, regardless of case.")] string Name) : IGroupName;
