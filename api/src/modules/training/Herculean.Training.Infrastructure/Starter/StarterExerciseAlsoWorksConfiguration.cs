using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Starter;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.Starter;

internal sealed class StarterExerciseAlsoWorksConfiguration : IEntityTypeConfiguration<StarterExerciseAlsoWorks>
{
    public void Configure(EntityTypeBuilder<StarterExerciseAlsoWorks> builder)
    {
        // No DbSet names this table, so it is named here.
        builder.ToTable("starter_exercise_also_works");
        builder.Property(alsoWorks => alsoWorks.Id).HasConversion<TypedIdConverter<StarterExerciseAlsoWorksId>>().ValueGeneratedNever();
        builder.Property(alsoWorks => alsoWorks.ExerciseId).HasConversion<TypedIdConverter<StarterExerciseId>>();
        builder.Property(alsoWorks => alsoWorks.GroupId).HasConversion<TypedIdConverter<StarterGroupId>>();
        builder.HasIndex(alsoWorks => new { alsoWorks.ExerciseId, alsoWorks.GroupId }).IsUnique();

        builder.HasOne<StarterGroup>()
            .WithMany()
            .HasForeignKey(alsoWorks => alsoWorks.GroupId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
