namespace RTM.Domain.Entities;

public class Score
{
    public int Id { get; set; }
    public string Player { get; set; } = "guest";
    public string? UserId { get; set; }
    public int Difficulty { get; set; }
    public int TimeMs { get; set; }
    public int Attempts { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Score() { }

    public Score(string? player, int difficulty, int timeMs, int attempts, string? userId = null)
    {
        Player = string.IsNullOrWhiteSpace(player) ? "guest" : player.Trim();
        Difficulty = difficulty;
        TimeMs = timeMs;
        Attempts = attempts;
        UserId = userId;
        CreatedAt = DateTime.UtcNow;
    }
}
