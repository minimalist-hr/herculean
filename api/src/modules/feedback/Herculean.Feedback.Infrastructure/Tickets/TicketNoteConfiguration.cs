using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Herculean.Feedback.Infrastructure.Tickets;

internal sealed class TicketNoteConfiguration : IEntityTypeConfiguration<TicketNote>
{
    public void Configure(EntityTypeBuilder<TicketNote> builder)
    {
        builder.Property(note => note.Id).HasConversion<TypedIdConverter<TicketNoteId>>().ValueGeneratedNever();
        builder.Property(note => note.UserId).HasConversion<TypedIdConverter<UserId>>();
        builder.Property(note => note.TicketId).HasConversion<TypedIdConverter<TicketId>>();
        builder.Property(note => note.Text).HasMaxLength(TicketNote.TextMaxLength);
        builder.HasIndex(note => note.TicketId);
        builder.HasIndex(note => note.UserId);
    }
}
