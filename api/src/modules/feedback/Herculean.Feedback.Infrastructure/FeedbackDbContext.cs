using Herculean.Feedback.Application.Auth;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Tickets;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.Infrastructure;

internal sealed class FeedbackDbContext(DbContextOptions<FeedbackDbContext> options, CurrentUser currentUser) : DbContext(options), IUnitOfWork
{
    internal const string Schema = "feedback";

    // Without a signed-in user this throws, so a query never runs unfiltered by accident. Deleting an account turns it off by name.
    internal const string UserFilter = "User";

    public DbSet<Ticket> Tickets => Set<Ticket>();

    private UserId CurrentUserId => currentUser.UserId;

    Task IUnitOfWork.SaveChangesAsync(CancellationToken cancellationToken) => SaveChangesAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new TicketConfiguration());
        modelBuilder.ApplyConfiguration(new TicketMessageConfiguration());
        modelBuilder.ApplyConfiguration(new ScreenshotConfiguration());

        modelBuilder.Entity<Ticket>()
            .HasQueryFilter(UserFilter, ticket => ticket.UserId == CurrentUserId);
        modelBuilder.Entity<TicketMessage>()
            .HasQueryFilter(UserFilter, message => message.UserId == CurrentUserId);
        modelBuilder.Entity<Screenshot>()
            .HasQueryFilter(UserFilter, screenshot => screenshot.UserId == CurrentUserId);
    }
}
