using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.Exercises;

internal sealed class ExerciseAlsoWorksConfiguration : IEntityTypeConfiguration<ExerciseAlsoWorks>
{
    public void Configure(EntityTypeBuilder<ExerciseAlsoWorks> builder)
    {
        // No DbSet names this table, so it is named here.
        builder.ToTable("exercise_also_works");
        builder.Property(alsoWorks => alsoWorks.Id).HasConversion<TypedIdConverter<ExerciseAlsoWorksId>>().ValueGeneratedNever();
        builder.Property(alsoWorks => alsoWorks.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.Property(alsoWorks => alsoWorks.ExerciseId).HasConversion<TypedIdConverter<ExerciseId>>();
        builder.Property(alsoWorks => alsoWorks.GroupId).HasConversion<TypedIdConverter<GroupId>>();
        builder.HasIndex(alsoWorks => new { alsoWorks.ExerciseId, alsoWorks.GroupId }).IsUnique();

        builder.HasOne(alsoWorks => alsoWorks.Group)
            .WithMany()
            .HasForeignKey(alsoWorks => alsoWorks.GroupId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
