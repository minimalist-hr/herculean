using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.Groups;

internal sealed class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        builder.Property(group => group.Id).HasConversion<TypedIdConverter<GroupId>>().ValueGeneratedNever();
        builder.Property(group => group.UserId).HasConversion<TypedIdConverter<UserId>>();

        // A deleted group's name can be used again.
        builder.HasIndex(group => new { group.UserId, group.Name }).IsUnique().HasFilter("deleted_at_utc IS NULL");
    }
}
