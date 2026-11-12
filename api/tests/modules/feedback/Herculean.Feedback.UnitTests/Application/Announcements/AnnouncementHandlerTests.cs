using Herculean.Feedback.Application.Announcements;
using Herculean.Feedback.Application.Announcements.GetAnnouncement;
using Herculean.Feedback.Application.Announcements.RemoveAnnouncement;
using Herculean.Feedback.Application.Announcements.SaveAnnouncement;
using Herculean.Feedback.Infrastructure.Announcements;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.UnitTests.Application.Announcements;

/// <summary>The announcement's save, read and remove, against one database.</summary>
public abstract class AnnouncementHandlerTests : IDisposable
{
    internal FeedbackDatabase Database { get; } = new();

    internal SaveAnnouncementHandler Save => new(new SaveAnnouncementValidator(), new AnnouncementRepository(Database.DbContext), Database.DbContext);

    internal async Task<AnnouncementResponse?> ReadAsync() =>
        (await new GetAnnouncementHandler(new AnnouncementReadRepository(Database.DbContext)).HandleAsync(FeedbackDatabase.Token)).Announcement;

    public void Dispose()
    {
        Database.Dispose();
        GC.SuppressFinalize(this);
    }
}

public sealed class GetAnnouncementHandlerTests : AnnouncementHandlerTests
{
    [Fact]
    public async Task WithoutOneItIsNull()
    {
        (await ReadAsync()).ShouldBeNull();
    }
}

public sealed class SaveAnnouncementHandlerTests : AnnouncementHandlerTests
{
    [Fact]
    public async Task ItIsSavedTrimmed()
    {
        Result result = await Save.HandleAsync(new SaveAnnouncementRequest(" New in 1.1 ", " Supersets are here. "), FeedbackDatabase.Token);

        result.IsSuccess.ShouldBeTrue();
        AnnouncementResponse announcement = (await ReadAsync()).ShouldNotBeNull();
        announcement.Title.ShouldBe("New in 1.1");
        announcement.Text.ShouldBe("Supersets are here.");
    }

    [Fact]
    public async Task ANewOneReplacesTheLastWithANewId()
    {
        await Save.HandleAsync(new SaveAnnouncementRequest("First", "Text"), FeedbackDatabase.Token);
        Guid first = (await ReadAsync())!.Id;

        await Save.HandleAsync(new SaveAnnouncementRequest("Second", "Text"), FeedbackDatabase.Token);

        AnnouncementResponse second = (await ReadAsync()).ShouldNotBeNull();
        second.Title.ShouldBe("Second");
        second.Id.ShouldNotBe(first);
        Database.DbContext.Announcements.Count().ShouldBe(1);
    }

    [Theory]
    [InlineData(" ", "Text", "title", "Enter a title.")]
    [InlineData("Title", " ", "text", "Write the announcement.")]
    public async Task EmptyFieldsAreNotValid(string title, string text, string field, string error)
    {
        Result result = await Save.HandleAsync(new SaveAnnouncementRequest(title, text), FeedbackDatabase.Token);

        result.Error.ShouldNotBeNull().Fields[field].ShouldBe([error]);
    }

    [Fact]
    public async Task TooLongFieldsAreNotValid()
    {
        Result result = await Save.HandleAsync(new SaveAnnouncementRequest(new string('a', 61), new string('a', 301)), FeedbackDatabase.Token);

        result.Error.ShouldNotBeNull().Fields["title"].ShouldBe(["A title has at most 60 characters."]);
        result.Error.Fields["text"].ShouldBe(["An announcement has at most 300 characters."]);
    }
}

public sealed class RemoveAnnouncementHandlerTests : AnnouncementHandlerTests
{
    [Fact]
    public async Task ItGoesAndRemovingAgainChangesNothing()
    {
        await Save.HandleAsync(new SaveAnnouncementRequest("Title", "Text"), FeedbackDatabase.Token);
        RemoveAnnouncementHandler remove = new(new AnnouncementRepository(Database.DbContext), Database.DbContext);

        await remove.HandleAsync(FeedbackDatabase.Token);
        await remove.HandleAsync(FeedbackDatabase.Token);

        (await ReadAsync()).ShouldBeNull();
    }
}
