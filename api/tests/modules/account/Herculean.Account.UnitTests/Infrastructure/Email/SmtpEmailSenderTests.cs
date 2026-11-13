using System.Net;
using System.Net.Sockets;

using Herculean.Account.Infrastructure.Email;
using Herculean.Account.UnitTests.Application;

using Microsoft.Extensions.Options;

namespace Herculean.Account.UnitTests.Infrastructure.Email;

public sealed class SmtpEmailSenderTests
{
    [Fact]
    public async Task SendsTheEmailWithoutSigningInWhenThereIsNoPassword()
    {
        using FakeSmtpServer server = new();

        await SendAsync(server, password: string.Empty);

        IReadOnlyList<string> commands = await server.CommandsAsync();
        commands.ShouldNotContain(command => command.StartsWith("AUTH", StringComparison.Ordinal));
        commands.ShouldContain(command => command.StartsWith("MAIL FROM:<no-reply@minimalist.hr>", StringComparison.Ordinal));
        commands.ShouldContain(command => command.StartsWith("RCPT TO:<filip@example.com>", StringComparison.Ordinal));
        server.Data.ShouldContain("Subject: Reset your Herculean password");
    }

    [Fact]
    public async Task SignsInWhenThereIsAPassword()
    {
        using FakeSmtpServer server = new();

        await SendAsync(server, password: "secret");

        (await server.CommandsAsync()).ShouldContain(command => command.StartsWith("AUTH", StringComparison.Ordinal));
    }

    [Fact]
    public async Task SendsThePasswordChangedEmail()
    {
        using FakeSmtpServer server = new();

        await CreateSender(server, password: string.Empty).SendPasswordChangedAsync("filip@example.com", DateTimeOffset.UnixEpoch, "Europe/Zagreb", withResetLink: false, TestContext.Current.CancellationToken);

        (await server.CommandsAsync()).ShouldContain(command => command.StartsWith("RCPT TO:<filip@example.com>", StringComparison.Ordinal));
        server.Data.ShouldContain("Subject: Your Herculean password was changed");
    }

    [Fact]
    public async Task SendsTheAccountKeptEmail()
    {
        using FakeSmtpServer server = new();

        await CreateSender(server, password: string.Empty).SendAccountKeptAsync("ana@example.com", TestContext.Current.CancellationToken);

        (await server.CommandsAsync()).ShouldContain(command => command.StartsWith("RCPT TO:<ana@example.com>", StringComparison.Ordinal));
        server.Data.ShouldContain("Subject: Your Herculean account will be kept");
    }

    [Fact]
    public async Task SendsTheAccountDeletedEmail()
    {
        using FakeSmtpServer server = new();

        await CreateSender(server, password: string.Empty).SendAccountDeletedAsync("filip@example.com", DateTimeOffset.UnixEpoch, "Europe/Zagreb", TestContext.Current.CancellationToken);

        (await server.CommandsAsync()).ShouldContain(command => command.StartsWith("RCPT TO:<filip@example.com>", StringComparison.Ordinal));
        server.Data.ShouldContain("Subject: Your Herculean account was deleted");
    }

    [Fact]
    public async Task SendsTheDeletionScheduledEmail()
    {
        using FakeSmtpServer server = new();

        await CreateSender(server, password: string.Empty).SendAccountDeletionScheduledAsync("filip@example.com", DateTimeOffset.UnixEpoch, "Europe/Zagreb", TestContext.Current.CancellationToken);

        (await server.CommandsAsync()).ShouldContain(command => command.StartsWith("RCPT TO:<filip@example.com>", StringComparison.Ordinal));
        server.Data.ShouldContain("Subject: Your Herculean account will be deleted");
    }

    [Fact]
    public async Task SendsTheEmailChangeLink()
    {
        using FakeSmtpServer server = new();

        await CreateSender(server, password: string.Empty).SendEmailChangeAsync("new@example.com", "token", TestContext.Current.CancellationToken);

        (await server.CommandsAsync()).ShouldContain(command => command.StartsWith("RCPT TO:<new@example.com>", StringComparison.Ordinal));
        server.Data.ShouldContain("Subject: Confirm your new Herculean email");
    }

    [Fact]
    public async Task SendsTheEmailChangedNoticeToTheOldAddress()
    {
        using FakeSmtpServer server = new();

        await CreateSender(server, password: string.Empty).SendEmailChangedAsync("old@example.com", DateTimeOffset.UnixEpoch, "Europe/Zagreb", TestContext.Current.CancellationToken);

        (await server.CommandsAsync()).ShouldContain(command => command.StartsWith("RCPT TO:<old@example.com>", StringComparison.Ordinal));
        server.Data.ShouldContain("Subject: Your Herculean email was changed");
    }

    private static Task SendAsync(FakeSmtpServer server, string password) =>
        CreateSender(server, password).SendPasswordResetAsync("filip@example.com", "token", TestContext.Current.CancellationToken);

    private static SmtpEmailSender CreateSender(FakeSmtpServer server, string password) =>
        new(
            Options.Create(new EmailOptions
            {
                Host = IPAddress.Loopback.ToString(),
                Port = server.Port,
                From = "Herculean <no-reply@minimalist.hr>",
                Username = "resend",
                Password = password,
            }),
            new FakeResetLinks(),
            new FakeEmailChangeLinks());

    /// <summary>Answers one SMTP conversation on a free local port and keeps what it was told.</summary>
    private sealed class FakeSmtpServer : IDisposable
    {
        private readonly TcpListener _listener = new(IPAddress.Loopback, 0);
        private readonly List<string> _commands = [];
        private readonly Task _conversation;

        public FakeSmtpServer()
        {
            _listener.Start();
            _conversation = AnswerAsync();
        }

        public int Port => ((IPEndPoint)_listener.LocalEndpoint).Port;

        public string Data { get; private set; } = string.Empty;

        public async Task<IReadOnlyList<string>> CommandsAsync()
        {
            await _conversation;

            return _commands;
        }

        public void Dispose()
        {
            _listener.Dispose();
        }

        private async Task AnswerAsync()
        {
            using TcpClient client = await _listener.AcceptTcpClientAsync();
            await using NetworkStream stream = client.GetStream();
            using StreamReader reader = new(stream);
            await using StreamWriter writer = new(stream) { NewLine = "\r\n", AutoFlush = true };

            await writer.WriteLineAsync("220 ready");
            while (await reader.ReadLineAsync() is string command)
            {
                _commands.Add(command);
                if (command.StartsWith("EHLO", StringComparison.Ordinal))
                {
                    await writer.WriteLineAsync("250-localhost");
                    await writer.WriteLineAsync("250 AUTH PLAIN");
                }
                else if (command.StartsWith("AUTH", StringComparison.Ordinal))
                {
                    await writer.WriteLineAsync("235 ok");
                }
                else if (command == "DATA")
                {
                    await writer.WriteLineAsync("354 go on");
                    Data = await ReadDataAsync(reader);
                    await writer.WriteLineAsync("250 ok");
                }
                else if (command == "QUIT")
                {
                    await writer.WriteLineAsync("221 bye");
                    return;
                }
                else
                {
                    await writer.WriteLineAsync("250 ok");
                }
            }
        }

        private static async Task<string> ReadDataAsync(StreamReader reader)
        {
            List<string> lines = [];
            while (await reader.ReadLineAsync() is string line && line != ".")
            {
                lines.Add(line);
            }

            return string.Join('\n', lines);
        }
    }
}
