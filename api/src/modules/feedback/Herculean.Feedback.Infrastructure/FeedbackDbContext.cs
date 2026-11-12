using Herculean.Feedback.Application.Auth;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Blocks;
using Herculean.Feedback.Domain.SavedReplies;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Blocks;
using Herculean.Feedback.Infrastructure.SavedReplies;
using Herculean.Feedback.Infrastructure.Tickets;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.Infrastructure;

internal sealed class FeedbackDbContext(DbContextOptions<FeedbackDbContext> options, CurrentUser currentUser) : DbContext(options), IUnitOfWork
{
    internal const string Schema = "feedback";

    // Without a signed-in user this throws, so a query never runs unfiltered by accident. Deleting an account turns it off by name.
    internal const string UserFilter = "User";

    public DbSet<Ticket> Tickets => Set<Ticket>();

    public DbSet<TicketNote> TicketNotes => Set<TicketNote>();

    public DbSet<SavedReply> SavedReplies => Set<SavedReply>();

    public DbSet<FeedbackBlock> FeedbackBlocks => Set<FeedbackBlock>();

    private UserId CurrentUserId => currentUser.UserId;

    Task IUnitOfWork.SaveChangesAsync(CancellationToken cancellationToken) => SaveChangesAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new TicketConfiguration());
        modelBuilder.ApplyConfiguration(new TicketMessageConfiguration());
        modelBuilder.ApplyConfiguration(new ScreenshotConfiguration());
        modelBuilder.ApplyConfiguration(new TicketNoteConfiguration());
        modelBuilder.ApplyConfiguration(new SavedReplyConfiguration());
        modelBuilder.ApplyConfiguration(new FeedbackBlockConfiguration());

        modelBuilder.Entity<Ticket>()
            .HasQueryFilter(UserFilter, ticket => ticket.UserId == CurrentUserId);
        modelBuilder.Entity<TicketMessage>()
            .HasQueryFilter(UserFilter, message => message.UserId == CurrentUserId);
        modelBuilder.Entity<Screenshot>()
            .HasQueryFilter(UserFilter, screenshot => screenshot.UserId == CurrentUserId);
        modelBuilder.Entity<TicketNote>()
            .HasQueryFilter(UserFilter, note => note.UserId == CurrentUserId);
        modelBuilder.Entity<FeedbackBlock>()
            .HasQueryFilter(UserFilter, block => block.UserId == CurrentUserId);
    }
}
