using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Feedback.Infrastructure.Tickets;

internal sealed class TicketMessageConfiguration : IEntityTypeConfiguration<TicketMessage>
{
    public void Configure(EntityTypeBuilder<TicketMessage> builder)
    {
        // No DbSet names this table, so it is named here.
        builder.ToTable("ticket_messages");
        builder.Property(message => message.Id).HasConversion<TypedIdConverter<TicketMessageId>>().ValueGeneratedNever();
        builder.Property(message => message.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.Property(message => message.TicketId).HasConversion<TypedIdConverter<TicketId>>();
        builder.Property(message => message.Author).HasConversion<string>().HasMaxLength(20);
        builder.Property(message => message.Text).HasMaxLength(Ticket.MessageMaxLength);

        builder.HasMany(message => message.Screenshots)
            .WithOne()
            .HasForeignKey(screenshot => screenshot.MessageId)
            .OnDelete(DeleteBehavior.ClientCascade);
    }
}
