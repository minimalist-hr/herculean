using Herculean.SharedKernel.Persistence;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Training.Infrastructure.WeekPlan;

internal sealed class WeekPlanDayConfiguration : IEntityTypeConfiguration<WeekPlanDay>
{
    public void Configure(EntityTypeBuilder<WeekPlanDay> builder)
    {
        builder.Property(day => day.Id).HasConversion<TypedIdConverter<WeekPlanDayId>>().ValueGeneratedNever();
        builder.Property(day => day.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.Property(day => day.RoutineId).HasConversion<TypedIdConverter<RoutineId>>();
        builder.Property(day => day.Weekday).HasConversion<string>().HasMaxLength(9);
        builder.HasIndex(day => new { day.UserId, day.Weekday, day.EffectiveFrom }).IsUnique();

        builder.HasOne(day => day.Routine)
            .WithMany()
            .HasForeignKey(day => day.RoutineId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
