using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Starter;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.Starter;

internal sealed class StarterGroupConfiguration : IEntityTypeConfiguration<StarterGroup>
{
    internal const string NameIndex = "ix_starter_groups_normalized_name";

    public void Configure(EntityTypeBuilder<StarterGroup> builder)
    {
        builder.Property(group => group.Id).HasConversion<TypedIdConverter<StarterGroupId>>().ValueGeneratedNever();
        builder.Property(group => group.Name).HasMaxLength(Group.NameMaxLength);
        builder.Property(group => group.NormalizedName).HasMaxLength(Group.NameMaxLength);
        builder.HasIndex(group => group.NormalizedName).IsUnique().HasDatabaseName(NameIndex);
    }
}
