using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.Workouts;

internal sealed class WorkoutConfiguration : IEntityTypeConfiguration<Workout>
{
    internal const string DateIndex = "ix_workouts_user_id_date";

    internal const string InProgressIndex = "ix_workouts_user_id";

    public void Configure(EntityTypeBuilder<Workout> builder)
    {
        builder.Property(workout => workout.Id).HasConversion<TypedIdConverter<WorkoutId>>().ValueGeneratedNever();
        builder.Property(workout => workout.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.Property(workout => workout.RoutineId).HasConversion<TypedIdConverter<RoutineId>>();
        builder.Property(workout => workout.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(workout => workout.Name).HasMaxLength(Routine.NameMaxLength);

        // One workout per date. A deleted one leaves its date free.
        builder.HasIndex(workout => new { workout.UserId, workout.Date }).IsUnique().HasFilter("deleted_at_utc IS NULL").HasDatabaseName(DateIndex);

        // One workout in progress per user.
        builder.HasIndex(workout => workout.UserId).IsUnique().HasFilter("status = 'InProgress' AND deleted_at_utc IS NULL").HasDatabaseName(InProgressIndex);

        builder.HasMany(workout => workout.Exercises)
            .WithOne()
            .HasForeignKey(exercise => exercise.WorkoutId)
            .OnDelete(DeleteBehavior.ClientCascade);

        builder.HasOne<Routine>()
            .WithMany()
            .HasForeignKey(workout => workout.RoutineId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
