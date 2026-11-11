namespace Herculean.Feedback.Domain.Tickets;

/// <summary>What the feedback was sent from.</summary>
internal sealed record DeviceInfo(string AppVersion, string? Phone, string Os);
