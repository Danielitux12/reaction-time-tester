using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShooterBackend.Data;
using ShooterBackend.Models;

namespace ShooterBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ScoresController : ControllerBase
{
    private readonly AppDbContext _db;

    public ScoresController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Score>>> Get([FromQuery] int limit = 10, CancellationToken cancellationToken = default)
    {
        limit = Math.Clamp(limit, 1, 100);

        var scores = await _db.Scores
            .AsNoTracking()
            .OrderBy(s => s.TimeMs)
            .ThenBy(s => s.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return Ok(scores);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Score>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var score = await _db.Scores
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        return score is null ? NotFound() : Ok(score);
    }

    [HttpPost]
    public async Task<ActionResult<Score>> Post([FromBody] ScoreRequest request, CancellationToken cancellationToken = default)
    {
        var score = new Score
        {
            Player = string.IsNullOrWhiteSpace(request.Player) ? "guest" : request.Player.Trim(),
            Difficulty = request.Difficulty,
            TimeMs = request.TimeMs,
            Attempts = request.Attempts,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Scores.Add(score);
        await _db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = score.Id }, score);
    }
}
