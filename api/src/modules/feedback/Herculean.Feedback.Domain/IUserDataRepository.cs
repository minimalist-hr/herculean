namespace Herculean.Feedback.Domain;

internal interface IUserDataRepository
{
    /// <summary>Marks every ticket a user has for removal, with its messages and screenshots. Needs no signed-in user.</summary>
    Task RemoveAllAsync(UserId userId, CancellationToken cancellationToken);
}
