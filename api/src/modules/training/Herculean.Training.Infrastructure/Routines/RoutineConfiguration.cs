using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Routines;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.Routines;

internal sealed class RoutineConfiguration : IEntityTypeConfiguration<Routine>
{
    internal const string NameIndex = "ix_routines_user_id_normalized_name";

    public void Configure(EntityTypeBuilder<Routine> builder)
    {
        builder.Property(routine => routine.Id).HasConversion<TypedIdConverter<RoutineId>>().ValueGeneratedNever();
        builder.Property(routine => routine.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.Property(routine => routine.Name).HasMaxLength(Routine.NameMaxLength);
        builder.Property(routine => routine.NormalizedName).HasMaxLength(Routine.NameMaxLength);

        // A deleted routine's name can be used again.
        builder.HasIndex(routine => new { routine.UserId, routine.NormalizedName }).IsUnique().HasFilter("deleted_at_utc IS NULL").HasDatabaseName(NameIndex);

        builder.HasMany(routine => routine.Exercises)
            .WithOne()
            .HasForeignKey(exercise => exercise.RoutineId)
            .OnDelete(DeleteBehavior.ClientCascade);
    }
}
