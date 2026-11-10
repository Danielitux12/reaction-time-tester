namespace ShooterBackend.Application.DTOs;

public sealed class ScoreResponse
{
    public int Id { get; init; }
    public string? Player { get; init; }
    public int Difficulty { get; init; }
    public int TimeMs { get; init; }
    public int Attempts { get; init; }
    public DateTime CreatedAt { get; init; }
}
