namespace Herculean.Account.Domain;

/// <summary>Saves every change of a use case in one transaction. Repositories never save.</summary>
internal interface IUnitOfWork
{
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
