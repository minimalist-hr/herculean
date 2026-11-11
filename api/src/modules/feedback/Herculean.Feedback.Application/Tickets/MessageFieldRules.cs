using FluentValidation;

using Herculean.Feedback.Domain.Tickets;
using Herculean.SharedKernel.Validation;

namespace Herculean.Feedback.Application.Tickets;

/// <summary>The fields every message has, on new feedback and on replies.</summary>
internal interface IMessageFields
{
    string Message { get; }

    List<string>? Screenshots { get; }
}

internal static class MessageFieldRules
{
    public static void AddMessageFieldRules<TRequest>(this AbstractValidator<TRequest> validator)
        where TRequest : IMessageFields
    {
        validator.RuleFor(request => request.Message)
            .Must(message => !string.IsNullOrWhiteSpace(message))
            .WithMessage("Write a message.")
            .MaximumLength(Ticket.MessageMaxLength);

        validator.RuleFor(request => request.Screenshots)
            .Must(screenshots => screenshots is null || screenshots.Count <= Ticket.MaxScreenshots)
            .WithMessage($"At most {Ticket.MaxScreenshots} screenshots.");

        validator.RuleForEach(request => request.Screenshots)
            .MustBeJpeg()
            .WithMessage("Each screenshot must be a JPEG of at most 1 MB.");
    }

    /// <summary>The screenshots as images. Call it after validating.</summary>
    public static IEnumerable<byte[]> ToImages(this IMessageFields request) =>
        (request.Screenshots ?? []).Select(Convert.FromBase64String);
}
