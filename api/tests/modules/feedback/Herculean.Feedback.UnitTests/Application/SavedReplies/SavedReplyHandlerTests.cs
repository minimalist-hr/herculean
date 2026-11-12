using Herculean.Feedback.Application.SavedReplies;
using Herculean.Feedback.Domain.SavedReplies;
using Herculean.Feedback.Infrastructure.SavedReplies;
using Herculean.SharedKernel.Results;
using Herculean.Feedback.Application.SavedReplies.CreateSavedReply;
using Herculean.Feedback.Application.SavedReplies.DeleteSavedReply;
using Herculean.Feedback.Application.SavedReplies.ListSavedReplies;
using Herculean.Feedback.Application.SavedReplies.UpdateSavedReply;

namespace Herculean.Feedback.UnitTests.Application.SavedReplies;

/// <summary>A saved reply's create, list, change and delete, against one database.</summary>
public abstract class SavedReplyHandlerTests : IDisposable
{
    internal FeedbackDatabase Database { get; } = new();

    internal CreateSavedReplyHandler Create => new(new SaveSavedReplyValidator(), new SavedReplyRepository(Database.DbContext), Database.DbContext);

    internal ListSavedRepliesHandler List => new(new SavedReplyReadRepository(Database.DbContext));

    internal UpdateSavedReplyHandler Update => new(new SaveSavedReplyValidator(), new SavedReplyRepository(Database.DbContext), Database.DbContext);

    internal DeleteSavedReplyHandler Delete => new(new SavedReplyRepository(Database.DbContext), Database.DbContext);

    internal async Task<Guid> SaveAsync(string title, string text = "Thanks, {name}!") =>
        (await Create.HandleAsync(new SaveSavedReplyRequest(title, text), FeedbackDatabase.Token)).Value.Id;

    internal async Task<List<SavedReplyResponse>> ListAllAsync() => (await List.HandleAsync(FeedbackDatabase.Token)).Value;

    public void Dispose()
    {
        Database.Dispose();
        GC.SuppressFinalize(this);
    }
}

public sealed class CreateSavedReplyHandlerTests : SavedReplyHandlerTests
{
    [Fact]
    public async Task AReplyIsSavedTrimmed()
    {
        Result<SavedReplyCreatedResponse> result = await Create.HandleAsync(new SaveSavedReplyRequest(" Fixed ", " Fixed in 1.0.1, {name}. "), FeedbackDatabase.Token);

        result.IsSuccess.ShouldBeTrue();
        (await ListAllAsync()).ShouldHaveSingleItem().ShouldBe(new SavedReplyResponse(result.Value.Id, "Fixed", "Fixed in 1.0.1, {name}."));
    }

    [Fact]
    public async Task ATitleIsUniqueInAnyCase()
    {
        await SaveAsync("Fixed");

        Result<SavedReplyCreatedResponse> result = await Create.HandleAsync(new SaveSavedReplyRequest("FIXED ", "Again"), FeedbackDatabase.Token);

        result.Error.ShouldBe(SavedReplyErrors.TitleTaken);
    }

    [Fact]
    public async Task FiftyIsTheMost()
    {
        for (int index = 0; index < SavedReply.MaxCount; index++)
        {
            await SaveAsync($"Reply {index}");
        }

        Result<SavedReplyCreatedResponse> result = await Create.HandleAsync(new SaveSavedReplyRequest("One more", "Text"), FeedbackDatabase.Token);

        result.Error.ShouldBe(SavedReplyErrors.LimitReached);
    }

    [Theory]
    [InlineData(" ", "Text", "title", "Enter a title.")]
    [InlineData("Title", " ", "text", "Write the reply.")]
    public async Task EmptyFieldsAreNotValid(string title, string text, string field, string error)
    {
        Result<SavedReplyCreatedResponse> result = await Create.HandleAsync(new SaveSavedReplyRequest(title, text), FeedbackDatabase.Token);

        result.Error.ShouldNotBeNull().Fields[field].ShouldBe([error]);
    }

    [Fact]
    public async Task TooLongFieldsAreNotValid()
    {
        Result<SavedReplyCreatedResponse> result = await Create.HandleAsync(
            new SaveSavedReplyRequest(new string('a', SavedReply.TitleMaxLength + 1), new string('a', SavedReply.TextMaxLength + 1)), FeedbackDatabase.Token);

        result.Error.ShouldNotBeNull().Fields["title"].ShouldBe(["A title has at most 50 characters."]);
        result.Error.Fields["text"].ShouldBe(["A reply has at most 2,000 characters."]);
    }
}

public sealed class ListSavedRepliesHandlerTests : SavedReplyHandlerTests
{
    [Fact]
    public async Task RepliesComeInTheOrderTheyWereMade()
    {
        await SaveAsync("First");
        await SaveAsync("Second");

        (await ListAllAsync()).Select(reply => reply.Title).ShouldBe(["First", "Second"]);
    }
}

public sealed class UpdateSavedReplyHandlerTests : SavedReplyHandlerTests
{
    [Fact]
    public async Task AReplyIsChanged()
    {
        Guid id = await SaveAsync("Fixed");

        Result result = await Update.HandleAsync(id, new SaveSavedReplyRequest("fixed", "New text"), FeedbackDatabase.Token);

        result.IsSuccess.ShouldBeTrue();
        (await ListAllAsync()).ShouldHaveSingleItem().ShouldBe(new SavedReplyResponse(id, "fixed", "New text"));
    }

    [Fact]
    public async Task AnotherRepliesTitleIsTaken()
    {
        await SaveAsync("Fixed");
        Guid id = await SaveAsync("Thanks");

        Result result = await Update.HandleAsync(id, new SaveSavedReplyRequest("Fixed", "Text"), FeedbackDatabase.Token);

        result.Error.ShouldBe(SavedReplyErrors.TitleTaken);
    }

    [Fact]
    public async Task AMissingReplyIsNotFound()
    {
        Result result = await Update.HandleAsync(Guid.CreateVersion7(), new SaveSavedReplyRequest("Title", "Text"), FeedbackDatabase.Token);

        result.Error.ShouldBe(SavedReplyErrors.NotFound);
    }

    [Fact]
    public async Task AnEmptyTitleIsNotValid()
    {
        Guid id = await SaveAsync("Fixed");

        Result result = await Update.HandleAsync(id, new SaveSavedReplyRequest("", "Text"), FeedbackDatabase.Token);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("title");
    }
}

public sealed class DeleteSavedReplyHandlerTests : SavedReplyHandlerTests
{
    [Fact]
    public async Task AReplyIsDeleted()
    {
        Guid id = await SaveAsync("Fixed");

        (await Delete.HandleAsync(id, FeedbackDatabase.Token)).IsSuccess.ShouldBeTrue();

        (await ListAllAsync()).ShouldBeEmpty();
    }

    [Fact]
    public async Task AMissingReplyIsNotFound()
    {
        (await Delete.HandleAsync(Guid.CreateVersion7(), FeedbackDatabase.Token)).Error.ShouldBe(SavedReplyErrors.NotFound);
    }
}
