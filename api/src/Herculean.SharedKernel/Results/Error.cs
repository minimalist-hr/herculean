namespace Herculean.SharedKernel.Results;

/// <summary>An expected failure. Bugs are exceptions instead.</summary>
public sealed record Error
{
    private static readonly IReadOnlyDictionary<string, string[]> NoFields = new Dictionary<string, string[]>();

    private Error(ErrorType type, string code, string description, IReadOnlyDictionary<string, string[]> fields)
    {
        Type = type;
        Code = code;
        Description = description;
        Fields = fields;
    }

    /// <summary>The kind of failure.</summary>
    public ErrorType Type { get; }

    /// <summary>A stable code for the app, for example <c>user.email_taken</c>.</summary>
    public string Code { get; }

    /// <summary>A sentence that explains the failure.</summary>
    public string Description { get; }

    /// <summary>Messages per request field. Only validation errors have them.</summary>
    public IReadOnlyDictionary<string, string[]> Fields { get; }

    /// <summary>Creates an error for a request with invalid fields.</summary>
    /// <param name="fields">Messages per field name.</param>
    public static Error Validation(IReadOnlyDictionary<string, string[]> fields) =>
        new(ErrorType.Validation, "validation", "One or more fields are not valid.", fields);

    /// <summary>Creates an error for a resource that does not exist.</summary>
    /// <param name="code">A stable code for the app.</param>
    /// <param name="description">A sentence that explains the failure.</param>
    public static Error NotFound(string code, string description) => new(ErrorType.NotFound, code, description, NoFields);

    /// <summary>Creates an error for a request that clashes with the current state.</summary>
    /// <param name="code">A stable code for the app.</param>
    /// <param name="description">A sentence that explains the failure.</param>
    public static Error Conflict(string code, string description) => new(ErrorType.Conflict, code, description, NoFields);
}
