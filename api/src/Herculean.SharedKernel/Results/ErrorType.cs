namespace Herculean.SharedKernel.Results;

/// <summary>The kind of expected failure. It decides the HTTP status.</summary>
public enum ErrorType
{
    /// <summary>The request has invalid fields. HTTP 400.</summary>
    Validation,

    /// <summary>The caller is not who they claim, for example a wrong password or an unknown refresh token. HTTP 401.</summary>
    Unauthorized,

    /// <summary>The resource does not exist. HTTP 404.</summary>
    NotFound,

    /// <summary>The request clashes with the current state. HTTP 409.</summary>
    Conflict,
}
