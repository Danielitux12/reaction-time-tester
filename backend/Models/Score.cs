using System;
using System.ComponentModel.DataAnnotations;

namespace ShooterBackend.Models;

public class Score
{
    [Key]
    public int Id { get; set; }

    public string? Player { get; set; }

    public int Difficulty { get; set; }

    public int TimeMs { get; set; }

    public int Attempts { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
