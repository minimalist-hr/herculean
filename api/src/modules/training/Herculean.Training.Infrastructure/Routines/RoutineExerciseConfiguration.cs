using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.Routines;

internal sealed class RoutineExerciseConfiguration : IEntityTypeConfiguration<RoutineExercise>
{
    public void Configure(EntityTypeBuilder<RoutineExercise> builder)
    {
        // No DbSet names this table, so it is named here.
        builder.ToTable("routine_exercises");
        builder.Property(exercise => exercise.Id).HasConversion<TypedIdConverter<RoutineExerciseId>>().ValueGeneratedNever();
        builder.Property(exercise => exercise.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.Property(exercise => exercise.RoutineId).HasConversion<TypedIdConverter<RoutineId>>();
        builder.Property(exercise => exercise.ExerciseId).HasConversion<TypedIdConverter<ExerciseId>>();
        builder.HasIndex(exercise => new { exercise.RoutineId, exercise.ExerciseId }).IsUnique();

        builder.HasOne(exercise => exercise.Exercise)
            .WithMany()
            .HasForeignKey(exercise => exercise.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
