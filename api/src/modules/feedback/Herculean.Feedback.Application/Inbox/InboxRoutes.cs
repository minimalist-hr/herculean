namespace Herculean.Feedback.Application.Inbox;

internal static class InboxRoutes
{
    public const string Tag = "Feedback inbox";

    public const string Tickets = "/api/v1/admin/feedback";

    public const string Stats = $"{Tickets}/stats";

    public const string Ticket = $"{Tickets}/{{id:guid}}";

    public const string Messages = $"{Ticket}/messages";

    public const string Status = $"{Ticket}/status";

    public const string Priority = $"{Ticket}/priority";

    public const string Notes = $"{Ticket}/notes";

    public const string Note = $"{Notes}/{{noteId:guid}}";

    public const string SavedReplies = $"{Tickets}/saved-replies";

    public const string SavedReply = $"{SavedReplies}/{{id:guid}}";

    public const string SavedRepliesTag = "Saved replies";

    public const string Screenshot = $"{Ticket}/screenshots/{{screenshotId:guid}}";
}
