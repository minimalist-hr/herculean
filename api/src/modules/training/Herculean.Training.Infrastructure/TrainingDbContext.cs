using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Settings;
using Herculean.Training.Infrastructure.Groups;
using Herculean.Training.Infrastructure.Settings;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure;

internal sealed class TrainingDbContext(DbContextOptions<TrainingDbContext> options) : DbContext(options), IUnitOfWork
{
    internal const string Schema = "training";

    public DbSet<WorkoutSettings> WorkoutSettings => Set<WorkoutSettings>();

    public DbSet<Group> Groups => Set<Group>();

    Task IUnitOfWork.SaveChangesAsync(CancellationToken cancellationToken) => SaveChangesAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new WorkoutSettingsConfiguration());
        modelBuilder.ApplyConfiguration(new GroupConfiguration());
    }
}
