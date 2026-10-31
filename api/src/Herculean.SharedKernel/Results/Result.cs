using System.Diagnostics.CodeAnalysis;

namespace Herculean.SharedKernel.Results;

/// <summary>The outcome of a use case: success, or an expected <see cref="Results.Error"/>.</summary>
public class Result
{
    private protected Result(Error? error)
    {
        Error = error;
    }

    /// <summary>True when the use case succeeded. Then <see cref="Error"/> is null.</summary>
    [MemberNotNullWhen(false, nameof(Error))]
    public bool IsSuccess => Error is null;

    /// <summary>Why the use case failed, or null on success.</summary>
    public Error? Error { get; }

    /// <summary>Creates a successful result.</summary>
    public static Result Success() => new(null);

    /// <summary>Creates a failed result.</summary>
    /// <param name="error">Why the use case failed.</param>
    public static Result Failure(Error error) => new(error);

    /// <summary>Lets a use case return an error as a failed result.</summary>
    /// <param name="error">Why the use case failed.</param>
    public static implicit operator Result(Error error) => Failure(error);
}

/// <summary>The outcome of a use case that returns a value on success.</summary>
/// <typeparam name="TValue">The value a successful use case returns.</typeparam>
public sealed class Result<TValue> : Result
{
    private Result(TValue value) : base(null)
    {
        Value = value;
    }

    private Result(Error error) : base(error)
    {
    }

    /// <summary>The value of a successful result.</summary>
    /// <exception cref="InvalidOperationException">The result failed.</exception>
    public TValue Value
    {
        get => IsSuccess ? field! : throw new InvalidOperationException("A failed result has no value.");
        private init;
    }

    /// <summary>Lets a use case return its value as a successful result.</summary>
    /// <param name="value">The value.</param>
    public static implicit operator Result<TValue>(TValue value) => new(value);

    /// <summary>Lets a use case return an error as a failed result.</summary>
    /// <param name="error">Why the use case failed.</param>
    public static implicit operator Result<TValue>(Error error) => new(error);
}
