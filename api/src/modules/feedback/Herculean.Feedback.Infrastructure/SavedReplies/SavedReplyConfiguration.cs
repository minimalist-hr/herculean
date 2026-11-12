using Herculean.Feedback.Domain.SavedReplies;
using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Feedback.Infrastructure.SavedReplies;

internal sealed class SavedReplyConfiguration : IEntityTypeConfiguration<SavedReply>
{
    public void Configure(EntityTypeBuilder<SavedReply> builder)
    {
        builder.Property(savedReply => savedReply.Id).HasConversion<TypedIdConverter<SavedReplyId>>().ValueGeneratedNever();
        builder.Property(savedReply => savedReply.Title).HasMaxLength(SavedReply.TitleMaxLength);
        builder.Property(savedReply => savedReply.Text).HasMaxLength(SavedReply.TextMaxLength);
    }
}
