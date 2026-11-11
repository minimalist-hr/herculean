using FluentValidation;

using Herculean.Account.Contracts;
using Herculean.Feedback.Application.AccountDeleted;
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
using Herculean.Feedback.Domain.Tickets;
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
