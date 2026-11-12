namespace Herculean.Feedback.Domain.SavedReplies;

internal interface ISavedReplyRepository
{
    Task<SavedReply?> GetAsync(SavedReplyId id, CancellationToken cancellationToken);

    /// <summary>Every saved reply's ID and title, at most <see cref="SavedReply.MaxCount"/>.</summary>
    Task<List<(SavedReplyId Id, string Title)>> ListTitlesAsync(CancellationToken cancellationToken);

    void Add(SavedReply savedReply);

    void Remove(SavedReply savedReply);
}
