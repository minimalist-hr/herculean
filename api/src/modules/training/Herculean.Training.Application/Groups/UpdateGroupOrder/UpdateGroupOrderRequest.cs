using System.ComponentModel;

namespace Herculean.Training.Application.Groups.UpdateGroupOrder;

[Description("The order of the user's groups.")]
internal sealed record UpdateGroupOrderRequest(
    [property: Description("Every one of the user's groups, once each, in the new order.")] List<Guid> GroupIds);
