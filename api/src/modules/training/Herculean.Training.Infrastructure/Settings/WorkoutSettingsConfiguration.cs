using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Settings;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.Settings;

internal sealed class WorkoutSettingsConfiguration : IEntityTypeConfiguration<WorkoutSettings>
{
    public void Configure(EntityTypeBuilder<WorkoutSettings> builder)
    {
        builder.Property(workoutSettings => workoutSettings.Id).HasConversion<TypedIdConverter<WorkoutSettingsId>>().ValueGeneratedNever();
        builder.Property(workoutSettings => workoutSettings.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.HasIndex(workoutSettings => workoutSettings.UserId).IsUnique();
    }
}
