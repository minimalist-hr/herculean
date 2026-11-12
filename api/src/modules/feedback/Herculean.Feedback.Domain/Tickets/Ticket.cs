using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.Tickets;

/// <summary>Feedback from a user: a bug, a suggestion or anything else, and the messages that follow.</summary>
internal sealed class Ticket : Entity<TicketId>
{
    internal const int MessageMaxLength = 2000;

    internal const int MaxScreenshots = 4;

    /// <summary>New tickets a user can send in a day, against spam and storage.</summary>
    internal const int MaxPerDay = 10;

    internal const int AppVersionMaxLength = 50;

    internal const int PhoneMaxLength = 100;

    internal const int OsMaxLength = 50;

    private readonly List<TicketMessage> _messages = [];

    private Ticket(TicketId id, UserId userId, TicketType type, string appVersion, string? phone, string os) : base(id)
    {
        UserId = userId;
        Type = type;
        Status = TicketStatus.Open;
        AppVersion = appVersion;
        Phone = phone;
        Os = os;
    }

    public UserId UserId { get; private set; }

    public TicketType Type { get; private set; }

    public TicketStatus Status { get; private set; }

    public string AppVersion { get; private set; }

    public string? Phone { get; private set; }

    public string Os { get; private set; }

    public TicketPriority Priority { get; private set; } = TicketPriority.Normal;

    /// <summary>A reply from Minimalist that the user hasn't opened yet.</summary>
    public bool HasUnreadReply { get; private set; }

    public bool IsClosed => Status == TicketStatus.Closed;

    /// <summary>The messages added since the ticket was loaded. A loaded ticket doesn't read its old messages.</summary>
    public IReadOnlyList<TicketMessage> Messages => _messages;

    public static Ticket Create(UserId userId, TicketType type, string message, IEnumerable<byte[]> screenshots, DeviceInfo device)
    {
        Ticket ticket = new(TicketId.New(), userId, type, device.AppVersion.Trim(), string.IsNullOrWhiteSpace(device.Phone) ? null : device.Phone.Trim(), device.Os.Trim());
        ticket.AddMessage(MessageAuthor.User, message, screenshots);

        return ticket;
    }

    /// <summary>The user's reply, after which the ticket waits for Minimalist again. A closed ticket takes no replies.</summary>
    public void ReplyAsUser(string message, IEnumerable<byte[]> screenshots)
    {
        AddMessage(MessageAuthor.User, message, screenshots);
        Status = TicketStatus.Open;
    }

    /// <summary>Minimalist's reply. The ticket then waits for the user, who has an unread reply. A closed ticket takes no replies.</summary>
    public void ReplyAsAdmin(string message, IEnumerable<byte[]> screenshots)
    {
        AddMessage(MessageAuthor.Admin, message, screenshots);
        Status = TicketStatus.Answered;
        HasUnreadReply = true;
    }

    /// <summary>Done: no one can reply until it is reopened.</summary>
    public void Close()
    {
        Status = TicketStatus.Closed;
    }

    /// <summary>Waits for Minimalist again.</summary>
    public void Reopen()
    {
        Status = TicketStatus.Open;
    }

    public void ChangePriority(TicketPriority priority)
    {
        Priority = priority;
    }

    public void MarkRead()
    {
        HasUnreadReply = false;
    }

    private void AddMessage(MessageAuthor author, string message, IEnumerable<byte[]> screenshots)
    {
        _messages.Add(TicketMessage.Create(UserId, Id, author, message, screenshots));
    }
}
