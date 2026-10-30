using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace Herculean.ServiceDefaults;

public static class Extensions
{
    private const string HealthPath = "/health";

    public static void AddServiceDefaults(this IHostApplicationBuilder builder)
    {
        AddTelemetry(builder);

        builder.Services.AddHealthChecks();
    }

    public static void MapDefaultEndpoints(this WebApplication app)
    {
        // Public health endpoints need a security review first, so they exist only in development.
        if (app.Environment.IsDevelopment())
        {
            app.MapHealthChecks(HealthPath);
        }
    }

    private static void AddTelemetry(IHostApplicationBuilder builder)
    {
        builder.Logging.AddOpenTelemetry(logging =>
        {
            logging.IncludeFormattedMessage = true;
            logging.IncludeScopes = true;
        });

        var telemetry = builder.Services.AddOpenTelemetry()
            .WithMetrics(metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddRuntimeInstrumentation())
            .WithTracing(tracing => tracing
                .AddAspNetCoreInstrumentation(options => options.Filter = context => !IsHealthRequest(context))
                .AddHttpClientInstrumentation());

        // Aspire sets this endpoint, so logs, metrics and traces show in its dashboard.
        if (!string.IsNullOrWhiteSpace(builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]))
        {
            telemetry.UseOtlpExporter();
        }
    }

    private static bool IsHealthRequest(HttpContext context) =>
        context.Request.Path.StartsWithSegments(HealthPath);
}
