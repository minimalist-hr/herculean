using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.Exercises;

internal sealed class ExerciseConfiguration : IEntityTypeConfiguration<Exercise>
{
    public void Configure(EntityTypeBuilder<Exercise> builder)
    {
        builder.Property(exercise => exercise.Id).HasConversion<TypedIdConverter<ExerciseId>>().ValueGeneratedNever();
        builder.Property(exercise => exercise.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.HasIndex(exercise => exercise.UserId);

        builder.HasOne(exercise => exercise.Group)
            .WithMany(group => group.Exercises)
            .HasForeignKey(exercise => exercise.GroupId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
