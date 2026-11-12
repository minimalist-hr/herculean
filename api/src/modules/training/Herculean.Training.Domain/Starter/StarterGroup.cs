using Herculean.SharedKernel.Entities;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Domain.Starter;

/// <summary>A group every new account starts with. Minimalist owns it, and accounts already made keep their own copies.</summary>
[AdminData]
internal sealed class StarterGroup : Entity<StarterGroupId>
{
    private StarterGroup(StarterGroupId id, string name, int order) : base(id)
    {
        Name = name.Trim();
        NormalizedName = Group.NormalizeName(name);
        Order = order;
    }

    public string Name { get; private set; }

    /// <summary>For finding the name regardless of case.</summary>
    public string NormalizedName { get; private set; }

    /// <summary>A new account gets its groups in this order.</summary>
    public int Order { get; private set; }

    public static StarterGroup Create(string name, int order) => new(StarterGroupId.New(), name, order);

    public void Rename(string name)
    {
        Name = name.Trim();
        NormalizedName = Group.NormalizeName(name);
    }
}
