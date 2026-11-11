using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

using Herculean.Account.Infrastructure;
using Herculean.Feedback.Infrastructure;
using Herculean.ServiceDefaults;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Health;
using Herculean.SharedKernel.Results;
using Herculean.Training.Infrastructure;

using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddStandardProblemDetails();

// Numbers are JSON numbers only, never strings, so the API client gets number types. Enums are camelCase strings.
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict;
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, _, _) =>
    {
        document.Info.Title = "Herculean API";
        document.Info.Description = "The API of Herculean, a workout log for people who train on a fixed weekly split.";

        return Task.CompletedTask;
    });
    options.AddDocumentTransformer<BearerSecurityTransformer>();
    options.AddOperationTransformer<BearerSecurityTransformer>();
    options.AddSchemaTransformer<ProblemDetailsSchemaTransformer>();
});

// Every endpoint needs a signed-in user who isn't an admin, unless it says otherwise.
builder.Services.AddHerculeanAuthorization();
builder.Services.AddSystemHealth();

builder.AddAccountModule();
builder.AddTrainingModule();
builder.AddFeedbackModule();

// The build starts the API to write openapi.json. It has no secrets, so the settings checks are skipped.
if (Assembly.GetEntryAssembly()?.GetName().Name == "GetDocument.Insider")
{
    builder.Services.RemoveAll<IStartupValidator>();
}

// The browser preview runs on another origin. The phone app doesn't need CORS.
if (builder.Environment.IsDevelopment() && builder.Configuration["BrowserPreview:Origin"] is string browserPreviewOrigin)
{
    builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins(browserPreviewOrigin).AllowAnyHeader().AllowAnyMethod()));
}

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.UseCors();
}

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapDefaultEndpoints();
app.MapAccountModuleEndpoints();
app.MapTrainingModuleEndpoints();
app.MapFeedbackModuleEndpoints();
app.MapSystemHealth();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
    app.MapScalarApiReference().AllowAnonymous();

    // Production applies migrations when it deploys.
    await app.Services.MigrateAccountModuleDatabaseAsync();
    await app.Services.MigrateTrainingModuleDatabaseAsync();
    await app.Services.MigrateFeedbackModuleDatabaseAsync();
}

await app.RunAsync();

// Seals the class the compiler generates for this file.
internal sealed partial class Program;
