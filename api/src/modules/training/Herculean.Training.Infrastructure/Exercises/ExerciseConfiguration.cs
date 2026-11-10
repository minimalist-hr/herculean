using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.Exercises;

internal sealed class ExerciseConfiguration : IEntityTypeConfiguration<Exercise>
{
    internal const string NameIndex = "ix_exercises_user_id_normalized_name";

    public void Configure(EntityTypeBuilder<Exercise> builder)
    {
        builder.Property(exercise => exercise.Id).HasConversion<TypedIdConverter<ExerciseId>>().ValueGeneratedNever();
        builder.Property(exercise => exercise.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.Property(exercise => exercise.Name).HasMaxLength(Exercise.NameMaxLength);
        builder.Property(exercise => exercise.NormalizedName).HasMaxLength(Exercise.NameMaxLength);

        // A deleted exercise's name can be used again.
        builder.HasIndex(exercise => new { exercise.UserId, exercise.NormalizedName }).IsUnique().HasFilter("deleted_at_utc IS NULL").HasDatabaseName(NameIndex);

        builder.HasOne(exercise => exercise.Group)
            .WithMany(group => group.Exercises)
            .HasForeignKey(exercise => exercise.GroupId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(exercise => exercise.AlsoWorks)
            .WithOne()
            .HasForeignKey(alsoWorks => alsoWorks.ExerciseId)
            .OnDelete(DeleteBehavior.ClientCascade);
    }
}
