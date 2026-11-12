namespace Herculean.SharedKernel.Entities;

/// <summary>
/// Marks an entity Minimalist owns rather than a user, in a module that holds user data:
/// it has no UserId and no user filter, and deleting an account leaves it.
/// </summary>
[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public sealed class AdminDataAttribute : Attribute;
