using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using Npgsql;

namespace Herculean.SharedKernel.Persistence;

/// <summary>Says which error answers a request that a unique index stopped.</summary>
public static class UniqueIndexErrors
{
    /// <summary>Two requests at once can both pass a handler's check. The index stops the second, which then gets this error.</summary>
    /// <param name="services">The API's services.</param>
    /// <param name="indexName">The unique index's name in the database.</param>
    /// <param name="error">The same error the handler's check returns.</param>
    public static IServiceCollection AddUniqueIndexError(this IServiceCollection services, string indexName, Error error) =>
        services.AddSingleton(new UniqueIndexError(indexName, error));
}

internal sealed record UniqueIndexError(string IndexName, Error Error);

internal sealed class UniqueViolationHandler(IEnumerable<UniqueIndexError> indexErrors) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not DbUpdateException { InnerException: PostgresException { SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: string indexName } })
        {
            return false;
        }

        UniqueIndexError? indexError = indexErrors.FirstOrDefault(candidate => candidate.IndexName == indexName);
        if (indexError is null)
        {
            return false;
        }

        await indexError.Error.ToProblem().ExecuteAsync(httpContext);
        return true;
    }
}
