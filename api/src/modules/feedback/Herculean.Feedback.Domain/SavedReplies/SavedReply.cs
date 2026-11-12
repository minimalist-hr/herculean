using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.SavedReplies;

/// <summary>An answer Minimalist sends often, shared by every admin. It belongs to no user.</summary>
[AdminData]
internal sealed class SavedReply : Entity<SavedReplyId>
{
    internal const int TitleMaxLength = 50;

    internal const int TextMaxLength = 2000;

    internal const int MaxCount = 50;

    /// <summary>Written in a reply's text, it becomes the user's name when the reply is picked.</summary>
    internal const string NamePlaceholder = "{name}";

    private SavedReply(SavedReplyId id, string title, string text) : base(id)
    {
        Title = title;
        Text = text;
    }

    public string Title { get; private set; }

    public string Text { get; private set; }

    public static SavedReply Create(string title, string text) => new(SavedReplyId.New(), title.Trim(), text.Trim());

    public void Change(string title, string text)
    {
        Title = title.Trim();
        Text = text.Trim();
    }
}
