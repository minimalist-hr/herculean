using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Feedback.Infrastructure.Tickets;

internal sealed class ScreenshotConfiguration : IEntityTypeConfiguration<Screenshot>
{
    public void Configure(EntityTypeBuilder<Screenshot> builder)
    {
        // No DbSet names this table, so it is named here.
        builder.ToTable("screenshots");
        builder.Property(screenshot => screenshot.Id).HasConversion<TypedIdConverter<ScreenshotId>>().ValueGeneratedNever();
        builder.Property(screenshot => screenshot.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.Property(screenshot => screenshot.MessageId).HasConversion<TypedIdConverter<TicketMessageId>>();
    }
}
