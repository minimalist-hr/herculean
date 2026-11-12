using System.Reflection;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Herculean.SharedKernel.Configuration;

/// <summary>Settings checks that fit how the API runs.</summary>
public static class OptionsBuilderExtensions
{
    // The build starts the API to write openapi.json. It has no secrets, so the settings checks are skipped then.
    private static readonly bool WritingOpenApi = Assembly.GetEntryAssembly()?.GetName().Name == "GetDocument.Insider";

    /// <summary>Checks the settings when the API starts, except while the build writes openapi.json.</summary>
    public static OptionsBuilder<TOptions> ValidateWhenRunning<TOptions>(this OptionsBuilder<TOptions> options)
        where TOptions : class =>
        WritingOpenApi ? options : options.ValidateOnStart();
}
