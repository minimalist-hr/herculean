#:sdk Aspire.AppHost.Sdk@13.6.4
#:package Aspire.Hosting.JavaScript@13.6.4
#:package Aspire.Hosting.PostgreSQL@13.6.4
#:package CommunityToolkit.Aspire.Hosting.MailPit@13.6.1
#:property AspireUseCliBundle=true

using System.Net.NetworkInformation;
using System.Net.Sockets;

const int MetroPort = 8081;

// The phone reaches the API and Metro over the local network, not localhost.
// Like Expo, use the IPv4 address of the network interface that has a gateway.
var lanAddress = NetworkInterface.GetAllNetworkInterfaces()
    .Where(network => network.OperationalStatus == OperationalStatus.Up)
    .Select(network => network.GetIPProperties())
    .Where(properties => properties.GatewayAddresses.Any(gateway => gateway.Address.AddressFamily == AddressFamily.InterNetwork))
    .SelectMany(properties => properties.UnicastAddresses)
    .Select(unicast => unicast.Address)
    .FirstOrDefault(address => address.AddressFamily == AddressFamily.InterNetwork)?
    .ToString()
    ?? "localhost";

var builder = DistributedApplication.CreateBuilder(args);

var database = builder.AddPostgres("postgres")
    .WithDataVolume()
    .AddDatabase("database", "herculean");

builder.AddMailPit("mailpit");

var api = builder.AddProject("api", "../api/src/Herculean.Api/Herculean.Api.csproj")
    .WithEndpoint("http", endpoint =>
    {
        endpoint.IsProxied = false;
        endpoint.TargetPort = endpoint.Port;
        endpoint.TargetHost = "0.0.0.0";
    })
    .WithHttpHealthCheck("/health")
    .WithReference(database)
    .WaitFor(database);

var apiPort = api.GetEndpoint("http").Property(EndpointProperty.Port);
var expoGoUrl = $"exp://{lanAddress}:{MetroPort}";

var app = builder.AddJavaScriptApp("app", "../app", "start")
    .WithHttpEndpoint(port: MetroPort, targetPort: MetroPort, env: "RCT_METRO_PORT", isProxied: false)
    .WithUrlForEndpoint("http", url => url.DisplayText = "Browser")
    .WithUrl(expoGoUrl, "Expo Go")
    .WithEnvironment("EXPO_PUBLIC_API_URL", ReferenceExpression.Create($"http://{lanAddress}:{apiPort}"))
    .WaitFor(api);

// The API allows the browser preview's origin, and only that one.
api.WithEnvironment("BrowserPreview__Origin", app.GetEndpoint("http"));

builder.Build().Run();
