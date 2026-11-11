using Herculean.SharedKernel.Time;

namespace Herculean.SharedKernel.UnitTests.Time;

public sealed class WeeksTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void AWeekIsTheLast7DaysAndEachWeekBefore()
    {
        Weeks.StartOf(Now, 0).ShouldBe(Now.AddDays(-7));
        Weeks.StartOf(Now, 3).ShouldBe(Now.AddDays(-28));
    }

    [Fact]
    public void MomentsAreCountedIntoWeeksOldestFirst()
    {
        List<int> counts = Weeks.Count(
            [Now, Now.AddDays(-1), Now.AddDays(-6.9), Now.AddDays(-7.1), Now.AddDays(-27), Now.AddDays(-29), Now.AddDays(1)],
            Now);

        counts.ShouldBe([1, 0, 1, 3]);
    }

    [Fact]
    public void AMomentOutsideTheWeeksHasNoIndex()
    {
        Weeks.IndexOf(Now.AddDays(-2), Now).ShouldBe(3);
        Weeks.IndexOf(Now.AddDays(-29), Now).ShouldBeNull();
        Weeks.IndexOf(Now.AddMinutes(1), Now).ShouldBeNull();
    }
}
