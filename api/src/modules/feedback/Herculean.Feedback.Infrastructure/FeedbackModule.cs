using FluentValidation;

using Herculean.Account.Contracts;
using Herculean.Feedback.Application.AccountDeleted;
using Herculean.Feedback.Application.Announcements;
using Herculean.Feedback.Application.Announcements.GetAnnouncement;
using Herculean.Feedback.Application.Announcements.RemoveAnnouncement;
using Herculean.Feedback.Application.Announcements.SaveAnnouncement;
using Herculean.Feedback.Application.Blocks.BlockFeedback;
using Herculean.Feedback.Application.Blocks.GetFeedbackBlock;
using Herculean.Feedback.Application.Blocks.GetOwnFeedbackBlock;
using Herculean.Feedback.Application.Blocks.UnblockFeedback;
using Herculean.Feedback.Application.Inbox.AddTicketNote;
using Herculean.Feedback.Application.Inbox.DeleteTicketNote;
using Herculean.Feedback.Application.Inbox.UpdateTicketPriority;
using Herculean.Feedback.Application.SavedReplies;
using Herculean.Feedback.Application.SavedReplies.CreateSavedReply;
using Herculean.Feedback.Application.SavedReplies.DeleteSavedReply;
using Herculean.Feedback.Application.SavedReplies.ListSavedReplies;
using Herculean.Feedback.Application.SavedReplies.UpdateSavedReply;
using Herculean.Feedback.Application.Auth;
using Herculean.Feedback.Application.Inbox;
using Herculean.Feedback.Application.Inbox.GetFeedbackStats;
using Herculean.Feedback.Application.Inbox.GetInboxScreenshot;
using Herculean.Feedback.Application.Inbox.GetInboxTicket;
using Herculean.Feedback.Application.Inbox.ListInboxTickets;
using Herculean.Feedback.Application.Inbox.ReplyToTicket;
using Herculean.Feedback.Application.Inbox.UpdateTicketStatus;
using Herculean.Feedback.Application.Tickets;
using Herculean.Feedback.Application.Tickets.AddTicketMessage;
using Herculean.Feedback.Application.Tickets.CreateTicket;
using Herculean.Feedback.Application.Tickets.ExportFeedback;
using Herculean.Feedback.Application.Tickets.GetScreenshot;
using Herculean.Feedback.Application.Tickets.GetTicket;
using Herculean.Feedback.Application.Tickets.GetUnreadFeedback;
using Herculean.Feedback.Application.Tickets.ListTickets;
using Herculean.Feedback.Application.Tickets.MarkTicketRead;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Announcements;
using Herculean.Feedback.Domain.Blocks;
using Herculean.Feedback.Domain.SavedReplies;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Announcements;
using Herculean.Feedback.Infrastructure.Blocks;
using Herculean.Feedback.Infrastructure.SavedReplies;
using Herculean.Feedback.Infrastructure.Inbox;
using Herculean.Feedback.Infrastructure.Tickets;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Events;
using Herculean.SharedKernel.Persistence;

using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Herculean.Feedback.Infrastructure;

/// <summary>The Feedback module: tickets users send, and the replies. The only way into the module.</summary>
public static class FeedbackModule
{
    /// <summary>Registers everything the Feedback module needs.</summary>
    /// <param name="builder">The API's builder.</param>
    public static void AddFeedbackModule(this IHostApplicationBuilder builder)
    {
        builder.AddModuleDbContext<FeedbackDbContext>(FeedbackDbContext.Schema);
        builder.Services.AddScoped<IUnitOfWork>(services => services.GetRequiredService<FeedbackDbContext>());

        builder.Services.AddCurrentUserAccessor();
        builder.Services.AddScoped<CurrentUser>();

        builder.Services.AddScoped<ITicketRepository, TicketRepository>();
        builder.Services.AddScoped<ITicketReadRepository, TicketReadRepository>();
        builder.Services.AddScoped<IInboxReadRepository, InboxReadRepository>();

        builder.Services.AddScoped<IUserDataRepository, UserDataRepository>();
        builder.Services.AddIntegrationEventHandler<AccountDeletedIntegrationEvent, AccountDeletedIntegrationEventHandler>();

        builder.Services.AddScoped<IValidator<CreateTicketRequest>, CreateTicketValidator>();
        builder.Services.AddScoped<CreateTicketHandler>();
        builder.Services.AddScoped<ListTicketsHandler>();
        builder.Services.AddScoped<GetTicketHandler>();
        builder.Services.AddScoped<GetScreenshotHandler>();
        builder.Services.AddScoped<IValidator<AddTicketMessageRequest>, AddTicketMessageValidator>();
        builder.Services.AddScoped<AddTicketMessageHandler>();
        builder.Services.AddScoped<MarkTicketReadHandler>();
        builder.Services.AddScoped<GetUnreadFeedbackHandler>();
        builder.Services.AddScoped<ExportFeedbackHandler>();

        builder.Services.AddScoped<IValidator<ListInboxTicketsRequest>, ListInboxTicketsValidator>();
        builder.Services.AddScoped<ListInboxTicketsHandler>();
        builder.Services.AddScoped<GetInboxTicketHandler>();
        builder.Services.AddScoped<GetInboxScreenshotHandler>();
        builder.Services.AddScoped<IValidator<ReplyToTicketRequest>, ReplyToTicketValidator>();
        builder.Services.AddScoped<ReplyToTicketHandler>();
        builder.Services.AddScoped<IValidator<UpdateTicketStatusRequest>, UpdateTicketStatusValidator>();
        builder.Services.AddScoped<UpdateTicketStatusHandler>();
        builder.Services.AddScoped<GetFeedbackStatsHandler>();
        builder.Services.AddScoped<ITicketNoteRepository, TicketNoteRepository>();
        builder.Services.AddScoped<ISavedReplyRepository, SavedReplyRepository>();
        builder.Services.AddScoped<ISavedReplyReadRepository, SavedReplyReadRepository>();
        builder.Services.AddScoped<IFeedbackBlockRepository, FeedbackBlockRepository>();
        builder.Services.AddScoped<IValidator<UpdateTicketPriorityRequest>, UpdateTicketPriorityValidator>();
        builder.Services.AddScoped<UpdateTicketPriorityHandler>();
        builder.Services.AddScoped<IValidator<AddTicketNoteRequest>, AddTicketNoteValidator>();
        builder.Services.AddScoped<AddTicketNoteHandler>();
        builder.Services.AddScoped<DeleteTicketNoteHandler>();
        builder.Services.AddScoped<IValidator<SaveSavedReplyRequest>, SaveSavedReplyValidator>();
        builder.Services.AddScoped<ListSavedRepliesHandler>();
        builder.Services.AddScoped<CreateSavedReplyHandler>();
        builder.Services.AddScoped<UpdateSavedReplyHandler>();
        builder.Services.AddScoped<DeleteSavedReplyHandler>();
        builder.Services.AddScoped<GetFeedbackBlockHandler>();
        builder.Services.AddScoped<BlockFeedbackHandler>();
        builder.Services.AddScoped<UnblockFeedbackHandler>();
        builder.Services.AddScoped<GetOwnFeedbackBlockHandler>();
        builder.Services.AddScoped<IAnnouncementRepository, AnnouncementRepository>();
        builder.Services.AddScoped<IAnnouncementReadRepository, AnnouncementReadRepository>();
        builder.Services.AddScoped<GetAnnouncementHandler>();
        builder.Services.AddScoped<IValidator<SaveAnnouncementRequest>, SaveAnnouncementValidator>();
        builder.Services.AddScoped<SaveAnnouncementHandler>();
        builder.Services.AddScoped<RemoveAnnouncementHandler>();
    }

    /// <summary>Maps every Feedback endpoint.</summary>
    /// <param name="endpoints">The API's endpoints.</param>
    public static void MapFeedbackModuleEndpoints(this IEndpointRouteBuilder endpoints)
    {
        CreateTicketEndpoint.Map(endpoints);
        ListTicketsEndpoint.Map(endpoints);
        GetUnreadFeedbackEndpoint.Map(endpoints);
        ExportFeedbackEndpoint.Map(endpoints);
        ListInboxTicketsEndpoint.Map(endpoints);
        GetInboxTicketEndpoint.Map(endpoints);
        GetInboxScreenshotEndpoint.Map(endpoints);
        ReplyToTicketEndpoint.Map(endpoints);
        UpdateTicketStatusEndpoint.Map(endpoints);
        GetFeedbackStatsEndpoint.Map(endpoints);
        UpdateTicketPriorityEndpoint.Map(endpoints);
        AddTicketNoteEndpoint.Map(endpoints);
        DeleteTicketNoteEndpoint.Map(endpoints);
        ListSavedRepliesEndpoint.Map(endpoints);
        CreateSavedReplyEndpoint.Map(endpoints);
        UpdateSavedReplyEndpoint.Map(endpoints);
        DeleteSavedReplyEndpoint.Map(endpoints);
        GetFeedbackBlockEndpoint.Map(endpoints);
        BlockFeedbackEndpoint.Map(endpoints);
        UnblockFeedbackEndpoint.Map(endpoints);
        GetOwnFeedbackBlockEndpoint.Map(endpoints);
        GetAnnouncementEndpoint.Map(endpoints);
        GetAdminAnnouncementEndpoint.Map(endpoints);
        SaveAnnouncementEndpoint.Map(endpoints);
        RemoveAnnouncementEndpoint.Map(endpoints);
        GetTicketEndpoint.Map(endpoints);
        GetScreenshotEndpoint.Map(endpoints);
        AddTicketMessageEndpoint.Map(endpoints);
        MarkTicketReadEndpoint.Map(endpoints);
    }

    /// <summary>Applies the Feedback module's pending migrations.</summary>
    /// <param name="services">The API's services.</param>
    /// <param name="cancellationToken">Stops the migration.</param>
    public static Task MigrateFeedbackModuleDatabaseAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        return services.MigrateDatabaseAsync<FeedbackDbContext>(cancellationToken);
    }
}
