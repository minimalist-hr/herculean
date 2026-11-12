using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Starter;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.Starter;

internal sealed class StarterExerciseConfiguration : IEntityTypeConfiguration<StarterExercise>
{
    internal const string NameIndex = "ix_starter_exercises_normalized_name";

    public void Configure(EntityTypeBuilder<StarterExercise> builder)
    {
        builder.Property(exercise => exercise.Id).HasConversion<TypedIdConverter<StarterExerciseId>>().ValueGeneratedNever();
        builder.Property(exercise => exercise.GroupId).HasConversion<TypedIdConverter<StarterGroupId>>();
        builder.Property(exercise => exercise.Name).HasMaxLength(Exercise.NameMaxLength);
        builder.Property(exercise => exercise.NormalizedName).HasMaxLength(Exercise.NameMaxLength);
        builder.HasIndex(exercise => exercise.NormalizedName).IsUnique().HasDatabaseName(NameIndex);

        builder.HasOne<StarterGroup>()
            .WithMany()
            .HasForeignKey(exercise => exercise.GroupId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(exercise => exercise.AlsoWorks)
            .WithOne()
            .HasForeignKey(alsoWorks => alsoWorks.ExerciseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
