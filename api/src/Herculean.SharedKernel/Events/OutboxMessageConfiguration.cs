using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.SharedKernel.Events;

/// <summary>Stores a module's outbox in the module's own schema.</summary>
public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("outbox_messages");
        builder.Property(message => message.Id).ValueGeneratedNever();
        builder.Property(message => message.Content).HasColumnType("jsonb");

        // The job reads only the messages that wait.
        builder.HasIndex(message => message.OccurredAtUtc).HasFilter("processed_at_utc IS NULL");
    }
}
