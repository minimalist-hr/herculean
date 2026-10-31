using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure;

internal sealed class TrainingDbContext(DbContextOptions<TrainingDbContext> options) : DbContext(options)
{
    internal const string Schema = "training";

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
    }
}
