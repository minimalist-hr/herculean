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

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

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
