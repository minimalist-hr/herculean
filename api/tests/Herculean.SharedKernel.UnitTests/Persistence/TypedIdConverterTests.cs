using Herculean.SharedKernel.Persistence;

namespace Herculean.SharedKernel.UnitTests.Persistence;

public sealed class TypedIdConverterTests
{
    private readonly TypedIdConverter<TestId> _converter = new();

    [Fact]
    public void ConvertsIdToItsGuid()
    {
        Guid value = Guid.CreateVersion7();

        _converter.ConvertToProvider(new TestId(value)).ShouldBe(value);
    }

    [Fact]
    public void ConvertsGuidToId()
    {
        Guid value = Guid.CreateVersion7();

        _converter.ConvertFromProvider(value).ShouldBe(new TestId(value));
    }
}
