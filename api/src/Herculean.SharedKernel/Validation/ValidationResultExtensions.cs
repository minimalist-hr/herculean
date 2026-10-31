using System.Text.Json;

using FluentValidation.Results;

using Herculean.SharedKernel.Results;

namespace Herculean.SharedKernel.Validation;

/// <summary>Turns FluentValidation results into our own errors.</summary>
public static class ValidationResultExtensions
{
    /// <summary>Turns a failed validation into a validation error, with field names in camelCase like the JSON.</summary>
    /// <param name="result">The failed validation.</param>
    public static Error ToError(this ValidationResult result)
    {
        Dictionary<string, string[]> fields = result.Errors
            .GroupBy(failure => JsonNamingPolicy.CamelCase.ConvertName(failure.PropertyName))
            .ToDictionary(group => group.Key, group => group.Select(failure => failure.ErrorMessage).ToArray());

        return Error.Validation(fields);
    }
}
