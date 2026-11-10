using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RTM.Domain.Entities;

namespace RTM.Infrastructure.Persistence.Configurations;

public class ScoreConfiguration : IEntityTypeConfiguration<Score>
{
    public void Configure(EntityTypeBuilder<Score> builder)
    {
        builder.ToTable("Scores");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Player)
            .HasMaxLength(40)
            .IsRequired(false);

        builder.Property(s => s.UserId)
            .HasMaxLength(100)
            .IsRequired(false);

        builder.Property(s => s.Difficulty)
            .IsRequired();

        builder.Property(s => s.TimeMs)
            .IsRequired();

        builder.Property(s => s.Attempts)
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        // Index for performance when querying top scores sorted by TimeMs, CreatedAt
        builder.HasIndex(s => new { s.TimeMs, s.CreatedAt })
            .HasDatabaseName("IX_Scores_TimeMs_CreatedAt");
    }
}
