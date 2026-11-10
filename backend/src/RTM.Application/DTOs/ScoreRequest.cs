using System.ComponentModel.DataAnnotations;

namespace RTM.Application.DTOs;

public sealed class ScoreRequest
{
    [StringLength(40, ErrorMessage = "Player name cannot exceed 40 characters.")]
    public string? Player { get; init; }

    [Range(1, 3, ErrorMessage = "Difficulty must be between 1 and 3.")]
    public int Difficulty { get; init; }

    [Range(1, 10_000, ErrorMessage = "TimeMs must be between 1 and 10,000.")]
    public int TimeMs { get; init; }

    [Range(1, 10_000, ErrorMessage = "Attempts must be between 1 and 10,000.")]
    public int Attempts { get; init; }
}
