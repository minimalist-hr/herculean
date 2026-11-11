namespace Herculean.Feedback.Application.Tickets;

internal static class TicketRoutes
{
    public const string Tag = "Feedback";

    public const string Tickets = "/api/v1/feedback";

    public const string Unread = $"{Tickets}/unread";

    public const string Export = $"{Tickets}/export";

    public const string Ticket = $"{Tickets}/{{id:guid}}";

    public const string Messages = $"{Ticket}/messages";

    public const string Read = $"{Ticket}/read";

    public const string Screenshot = $"{Ticket}/screenshots/{{screenshotId:guid}}";
}
