namespace Herculean.Training.Domain;

internal interface IUserDataRepository
{
    /// <summary>Marks everything a user has for removal, soft-deleted rows included. Needs no signed-in user.</summary>
    Task RemoveAllAsync(UserId userId, CancellationToken cancellationToken);
}
