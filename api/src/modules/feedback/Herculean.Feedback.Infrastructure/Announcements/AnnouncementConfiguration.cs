using Herculean.Feedback.Domain.Announcements;
using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Feedback.Infrastructure.Announcements;

internal sealed class AnnouncementConfiguration : IEntityTypeConfiguration<Announcement>
{
    public void Configure(EntityTypeBuilder<Announcement> builder)
    {
        builder.Property(announcement => announcement.Id).HasConversion<TypedIdConverter<AnnouncementId>>().ValueGeneratedNever();
        builder.Property(announcement => announcement.Title).HasMaxLength(Announcement.TitleMaxLength);
        builder.Property(announcement => announcement.Text).HasMaxLength(Announcement.TextMaxLength);
    }
}
