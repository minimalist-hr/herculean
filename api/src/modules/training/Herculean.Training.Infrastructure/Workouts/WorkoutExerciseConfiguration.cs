using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Workouts;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.Workouts;

internal sealed class WorkoutExerciseConfiguration : IEntityTypeConfiguration<WorkoutExercise>
{
    public void Configure(EntityTypeBuilder<WorkoutExercise> builder)
    {
        // No DbSet names this table, so it is named here.
        builder.ToTable("workout_exercises");
        builder.Property(exercise => exercise.Id).HasConversion<TypedIdConverter<WorkoutExerciseId>>().ValueGeneratedNever();
        builder.Property(exercise => exercise.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.Property(exercise => exercise.WorkoutId).HasConversion<TypedIdConverter<WorkoutId>>();
        builder.Property(exercise => exercise.ExerciseId).HasConversion<TypedIdConverter<ExerciseId>>();
        builder.HasIndex(exercise => new { exercise.WorkoutId, exercise.ExerciseId }).IsUnique();

        builder.HasOne(exercise => exercise.Exercise)
            .WithMany()
            .HasForeignKey(exercise => exercise.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
