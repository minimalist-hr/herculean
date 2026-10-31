namespace Herculean.SharedKernel.Entities;

/// <summary>The base of every entity: when it was created and last updated.</summary>
public abstract class Entity
{
    // Entities derive from Entity<TId>, never from this class directly.
    private protected Entity()
    {
    }

    /// <summary>Set on save, from the time provider.</summary>
    public DateTimeOffset CreatedAtUtc { get; private set; }

    /// <summary>Set on save, from the time provider.</summary>
    public DateTimeOffset UpdatedAtUtc { get; private set; }
}

/// <summary>The base of every entity, with its typed ID.</summary>
/// <typeparam name="TId">The entity's ID type.</typeparam>
/// <param name="id">The new entity's ID.</param>
public abstract class Entity<TId>(TId id) : Entity
    where TId : struct, ITypedId<TId>
{
    /// <summary>The entity's ID.</summary>
    public TId Id { get; private init; } = id;
}
