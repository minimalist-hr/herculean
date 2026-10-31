namespace Herculean.SharedKernel.Entities;

/// <summary>An entity ID: a record struct of our own that wraps a UUID v7.</summary>
/// <typeparam name="TSelf">The ID type itself.</typeparam>
public interface ITypedId<TSelf> where TSelf : struct, ITypedId<TSelf>
{
    /// <summary>The UUID the ID wraps.</summary>
    Guid Value { get; }

    /// <summary>Creates the ID from a stored UUID.</summary>
    /// <param name="value">The UUID.</param>
    static abstract TSelf From(Guid value);
}
