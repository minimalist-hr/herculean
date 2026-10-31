using Herculean.Account.Infrastructure;
using Herculean.ServiceDefaults;
using Herculean.Training.Infrastructure;

using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

builder.AddAccountModule();
builder.AddTrainingModule();

if (builder.Environment.IsDevelopment())
{
    // The browser preview runs on another origin. The phone app doesn't need CORS.
    builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
}

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.UseCors();
}

app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();

    // Production applies migrations when it deploys.
    await app.Services.MigrateAccountModuleDatabaseAsync();
    await app.Services.MigrateTrainingModuleDatabaseAsync();
}

await app.RunAsync();

// Seals the class the compiler generates for this file.
internal sealed partial class Program;
