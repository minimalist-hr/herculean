using Herculean.Feedback.Application.Tickets.CreateTicket;
using Herculean.Feedback.Domain.Blocks;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Blocks;
using Herculean.Feedback.Infrastructure.Tickets;
using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Feedback.UnitTests.Application.Tickets;

public sealed class CreateTicketHandlerTests : IDisposable
{
    private static readonly string Jpeg = Convert.ToBase64String(FeedbackDatabase.Jpeg);
    private readonly FeedbackDatabase _database = new();
    private readonly FakeTimeProvider _timeProvider = new(new DateTimeOffset(2026, 11, 11, 12, 0, 0, TimeSpan.Zero));
    private readonly CreateTicketHandler _handler;

    public CreateTicketHandlerTests()
    {
        _handler = new CreateTicketHandler(new CreateTicketValidator(), _database.CurrentUser, new TicketRepository(_database.DbContext), new FeedbackBlockRepository(_database.DbContext), _timeProvider, _database.DbContext);
    }

    [Fact]
    public async Task ValidFeedbackIsSavedWithItsScreenshotsAndDevice()
    {
        Result<TicketCreatedResponse> result = await HandleAsync(Request() with { Screenshots = [Jpeg, Jpeg, Jpeg, Jpeg] });

        Ticket ticket = (await _database.ListAllTicketsAsync()).ShouldHaveSingleItem();
        result.Value.Id.ShouldBe(ticket.Id.Value);
        ticket.UserId.ShouldBe(_database.UserId);
        ticket.Type.ShouldBe(TicketType.Bug);
        ticket.Status.ShouldBe(TicketStatus.Open);
        ticket.Phone.ShouldBe("Google Pixel 8");
        TicketMessage message = (await _database.ListMessagesAsync(ticket)).ShouldHaveSingleItem();
        message.Text.ShouldBe("The timer stops.");
        message.Screenshots.Count.ShouldBe(4);
    }

    [Fact]
    public async Task ABlockedUserCantSendFeedback()
    {
        await _database.BlockAsync();

        Result<TicketCreatedResponse> result = await HandleAsync(Request());

        result.Error.ShouldBe(FeedbackBlockErrors.Blocked);
        (await _database.ListAllTicketsAsync()).ShouldBeEmpty();
    }

    [Fact]
    public async Task AnotherUsersBlockDoesntMatter()
    {
        await _database.BlockAsync(Herculean.Feedback.Domain.UserId.From(Guid.CreateVersion7()));

        (await HandleAsync(Request())).IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task NoScreenshotsIsFine()
    {
        Result<TicketCreatedResponse> result = await HandleAsync(Request() with { Screenshots = null, Phone = null });

        result.IsSuccess.ShouldBeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task AnEmptyMessageIsNotValid(string message)
    {
        Result<TicketCreatedResponse> result = await HandleAsync(Request() with { Message = message });

        result.Error.ShouldNotBeNull().Fields["message"].ShouldBe(["Write a message."]);
        (await _database.ListAllTicketsAsync()).ShouldBeEmpty();
    }

    [Fact]
    public async Task AMessageOver2000CharactersIsNotValid()
    {
        (await HandleAsync(Request() with { Message = new string('a', Ticket.MessageMaxLength) })).IsSuccess.ShouldBeTrue();

        (await HandleAsync(Request() with { Message = new string('a', Ticket.MessageMaxLength + 1) })).Error.ShouldNotBeNull().Fields.ShouldContainKey("message");
    }

    [Fact]
    public async Task FiveScreenshotsAreTooMany()
    {
        Result<TicketCreatedResponse> result = await HandleAsync(Request() with { Screenshots = [Jpeg, Jpeg, Jpeg, Jpeg, Jpeg] });

        result.Error.ShouldNotBeNull().Fields["screenshots"].ShouldBe(["At most 4 screenshots."]);
    }

    [Fact]
    public async Task AScreenshotThatIsNotAJpegIsNotValid()
    {
        string png = Convert.ToBase64String([0x89, 0x50, 0x4E, 0x47]);

        Result<TicketCreatedResponse> result = await HandleAsync(Request() with { Screenshots = [Jpeg, png] });

        result.Error.ShouldNotBeNull().Fields["screenshots[1]"].ShouldBe(["Each screenshot must be a JPEG of at most 1 MB."]);
    }

    [Fact]
    public async Task AScreenshotOver1MbIsNotValid()
    {
        byte[] large = new byte[JpegRules.MaxBytes + 1];
        FeedbackDatabase.Jpeg.CopyTo(large, 0);

        Result<TicketCreatedResponse> result = await HandleAsync(Request() with { Screenshots = [Convert.ToBase64String(large)] });

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("screenshots[0]");
    }

    [Fact]
    public async Task AnUnknownTypeIsNotValid()
    {
        Result<TicketCreatedResponse> result = await HandleAsync(Request() with { Type = (TicketType)7 });

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("type");
    }

    [Fact]
    public async Task TheDeviceMustBeKnownAndShort()
    {
        Result<TicketCreatedResponse> result = await HandleAsync(Request() with { AppVersion = "", Os = new string('a', Ticket.OsMaxLength + 1), Phone = new string('a', Ticket.PhoneMaxLength + 1) });

        result.Error.ShouldNotBeNull().Fields.Keys.ShouldBe(["appVersion", "phone", "os"], ignoreOrder: true);
    }

    [Fact]
    public async Task TenTicketsInADayReachTheLimit()
    {
        for (int sent = 0; sent < Ticket.MaxPerDay; sent++)
        {
            await _database.SaveTicketAsync(createdAtUtc: _timeProvider.GetUtcNow().AddHours(-23));
        }

        Result<TicketCreatedResponse> result = await HandleAsync(Request());

        result.Error.ShouldBe(TicketErrors.LimitReached);
        result.Error!.Description.ShouldContain("10");
        (await _database.ListAllTicketsAsync()).Count.ShouldBe(Ticket.MaxPerDay);
    }

    [Fact]
    public async Task TicketsOlderThanADayAndOtherUsersTicketsDoNotCount()
    {
        for (int sent = 0; sent < Ticket.MaxPerDay; sent++)
        {
            await _database.SaveTicketAsync(createdAtUtc: _timeProvider.GetUtcNow().AddHours(-25));
            await _database.SaveTicketAsync(userId: Herculean.Feedback.Domain.UserId.From(Guid.CreateVersion7()), createdAtUtc: _timeProvider.GetUtcNow());
        }

        (await HandleAsync(Request())).IsSuccess.ShouldBeTrue();
    }

    public void Dispose()
    {
        _database.Dispose();
    }

    private static CreateTicketRequest Request() =>
        new(TicketType.Bug, " The timer stops. ", [], "1.0.0", "Google Pixel 8", "Android 15");

    private Task<Result<TicketCreatedResponse>> HandleAsync(CreateTicketRequest request) =>
        _handler.HandleAsync(request, FeedbackDatabase.Token);
}
