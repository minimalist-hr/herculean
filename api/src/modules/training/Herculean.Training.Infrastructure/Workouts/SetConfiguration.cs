using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Workouts;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.Workouts;

internal sealed class SetConfiguration : IEntityTypeConfiguration<Set>
{
    public void Configure(EntityTypeBuilder<Set> builder)
    {
        // No DbSet names this table, so it is named here.
        builder.ToTable("sets");
        builder.Property(set => set.Id).HasConversion<TypedIdConverter<SetId>>().ValueGeneratedNever();
        builder.Property(set => set.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.Property(set => set.WorkoutExerciseId).HasConversion<TypedIdConverter<WorkoutExerciseId>>();
        builder.Property(set => set.WeightKg).HasPrecision(Set.WeightPrecision, Set.WeightScale);
    }
}
