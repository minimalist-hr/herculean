using Herculean.Training.Application.Auth;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Domain.Settings;
using Herculean.Training.Domain.Workouts;
using Herculean.Training.Infrastructure.Exercises;
using Herculean.Training.Infrastructure.Groups;
using Herculean.Training.Infrastructure.Routines;
using Herculean.Training.Infrastructure.WeekPlan;
using Herculean.Training.Infrastructure.Settings;
using Herculean.Training.Infrastructure.Workouts;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure;

internal sealed class TrainingDbContext(DbContextOptions<TrainingDbContext> options, CurrentUser currentUser) : DbContext(options), IUnitOfWork
{
    internal const string Schema = "training";

    // Without a signed-in user this throws, so a query never runs unfiltered by accident. A background job turns the filter off by name.
    internal const string UserFilter = "User";

    internal const string SoftDeleteFilter = "SoftDelete";

    public DbSet<WorkoutSettings> WorkoutSettings => Set<WorkoutSettings>();

    public DbSet<Group> Groups => Set<Group>();

    public DbSet<Exercise> Exercises => Set<Exercise>();

    public DbSet<Routine> Routines => Set<Routine>();

    public DbSet<WeekPlanDay> WeekPlanDays => Set<WeekPlanDay>();

    public DbSet<Workout> Workouts => Set<Workout>();

    private UserId CurrentUserId => currentUser.UserId;

    Task IUnitOfWork.SaveChangesAsync(CancellationToken cancellationToken) => SaveChangesAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new WorkoutSettingsConfiguration());
        modelBuilder.ApplyConfiguration(new GroupConfiguration());
        modelBuilder.ApplyConfiguration(new ExerciseConfiguration());
        modelBuilder.ApplyConfiguration(new ExerciseAlsoWorksConfiguration());
        modelBuilder.ApplyConfiguration(new RoutineConfiguration());
        modelBuilder.ApplyConfiguration(new RoutineExerciseConfiguration());
        modelBuilder.ApplyConfiguration(new WeekPlanDayConfiguration());
        modelBuilder.ApplyConfiguration(new WorkoutConfiguration());
        modelBuilder.ApplyConfiguration(new WorkoutExerciseConfiguration());

        modelBuilder.Entity<WorkoutSettings>()
            .HasQueryFilter(UserFilter, workoutSettings => workoutSettings.UserId == CurrentUserId);
        modelBuilder.Entity<Group>()
            .HasQueryFilter(UserFilter, group => group.UserId == CurrentUserId)
            .HasQueryFilter(SoftDeleteFilter, group => group.DeletedAtUtc == null);
        modelBuilder.Entity<Exercise>()
            .HasQueryFilter(UserFilter, exercise => exercise.UserId == CurrentUserId)
            .HasQueryFilter(SoftDeleteFilter, exercise => exercise.DeletedAtUtc == null);
        modelBuilder.Entity<ExerciseAlsoWorks>()
            .HasQueryFilter(UserFilter, alsoWorks => alsoWorks.UserId == CurrentUserId);
        modelBuilder.Entity<Routine>()
            .HasQueryFilter(UserFilter, routine => routine.UserId == CurrentUserId)
            .HasQueryFilter(SoftDeleteFilter, routine => routine.DeletedAtUtc == null);
        modelBuilder.Entity<RoutineExercise>()
            .HasQueryFilter(UserFilter, exercise => exercise.UserId == CurrentUserId);
        modelBuilder.Entity<WeekPlanDay>()
            .HasQueryFilter(UserFilter, day => day.UserId == CurrentUserId);
        modelBuilder.Entity<Workout>()
            .HasQueryFilter(UserFilter, workout => workout.UserId == CurrentUserId)
            .HasQueryFilter(SoftDeleteFilter, workout => workout.DeletedAtUtc == null);
        modelBuilder.Entity<WorkoutExercise>()
            .HasQueryFilter(UserFilter, exercise => exercise.UserId == CurrentUserId);
    }
}
