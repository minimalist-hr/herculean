namespace Herculean.SharedKernel.Queries;

/// <summary>Answers a question from another module. It only reads.</summary>
/// <typeparam name="TQuery">The question, from the answering module's Contracts.</typeparam>
/// <typeparam name="TResult">The answer.</typeparam>
public interface IQueryHandler<in TQuery, TResult>
    where TQuery : class
{
    /// <summary>Answers the question.</summary>
    /// <param name="query">The question.</param>
    /// <param name="cancellationToken">Stops the read.</param>
    Task<TResult> HandleAsync(TQuery query, CancellationToken cancellationToken);
}
