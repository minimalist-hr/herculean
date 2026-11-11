using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Feedback.Infrastructure.Tickets;

internal sealed class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.Property(ticket => ticket.Id).HasConversion<TypedIdConverter<TicketId>>().ValueGeneratedNever();
        builder.Property(ticket => ticket.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.Property(ticket => ticket.Type).HasConversion<string>().HasMaxLength(20);
        builder.Property(ticket => ticket.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(ticket => ticket.AppVersion).HasMaxLength(Ticket.AppVersionMaxLength);
        builder.Property(ticket => ticket.Phone).HasMaxLength(Ticket.PhoneMaxLength);
        builder.Property(ticket => ticket.Os).HasMaxLength(Ticket.OsMaxLength);
        builder.HasIndex(ticket => ticket.UserId);

        builder.HasMany(ticket => ticket.Messages)
            .WithOne()
            .HasForeignKey(message => message.TicketId)
            .OnDelete(DeleteBehavior.ClientCascade);
    }
}
