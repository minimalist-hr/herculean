using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Groups;

internal readonly record struct GroupId(Guid Value) : ITypedId<GroupId>
{
    public static GroupId New() => new(Guid.CreateVersion7());

    public static GroupId From(Guid value) => new(value);
}
