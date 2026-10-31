using Herculean.SharedKernel.Entities;

using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Herculean.SharedKernel.Persistence;

/// <summary>Stores a typed ID as its UUID.</summary>
/// <typeparam name="TId">The ID type.</typeparam>
public sealed class TypedIdConverter<TId>() : ValueConverter<TId, Guid>(id => id.Value, value => Create(value))
    where TId : struct, ITypedId<TId>
{
    // Expression trees cannot call a static abstract member directly.
    private static TId Create(Guid value) => TId.From(value);
}
