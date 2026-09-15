using System.ComponentModel.DataAnnotations;

namespace ShooterBackend.Models;

public sealed class ScoreRequest
{
    [StringLength(40)]
    public string? Player { get; init; }

    [Range(1, 3)]
    public int Difficulty { get; init; }

    [Range(1, 10_000)]
    public int TimeMs { get; init; }

    [Range(1, 10_000)]
    public int Attempts { get; init; }
}
