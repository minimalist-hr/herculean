using Herculean.SharedKernel.Entities;
using Herculean.SharedKernel.Persistence;

using Microsoft.EntityFrameworkCore;

namespace Herculean.SharedKernel.UnitTests;

internal readonly record struct TestId(Guid Value) : ITypedId<TestId>
{
    public static TestId New() => new(Guid.CreateVersion7());

    public static TestId From(Guid value) => new(value);
}

internal sealed class TestEntity(TestId id, string name) : Entity<TestId>(id)
{
    public string Name { get; private set; } = name;

    public void Rename(string name)
    {
        Name = name;
    }
}

internal sealed class TestDbContext(DbContextOptions<TestDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TestEntity>().Property(entity => entity.Id).HasConversion<TypedIdConverter<TestId>>();
    }
}
