using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Blocks;
using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Feedback.Infrastructure.Blocks;

internal sealed class FeedbackBlockConfiguration : IEntityTypeConfiguration<FeedbackBlock>
{
    public void Configure(EntityTypeBuilder<FeedbackBlock> builder)
    {
        builder.Property(block => block.Id).HasConversion<TypedIdConverter<FeedbackBlockId>>().ValueGeneratedNever();
        builder.Property(block => block.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.HasIndex(block => block.UserId).IsUnique();
    }
}
