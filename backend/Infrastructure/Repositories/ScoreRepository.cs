using Microsoft.EntityFrameworkCore;
using ShooterBackend.Domain.Entities;
using ShooterBackend.Domain.Interfaces;
using ShooterBackend.Infrastructure.Persistence;

namespace ShooterBackend.Infrastructure.Repositories;

public class ScoreRepository : IScoreRepository
{
    private readonly AppDbContext _db;

    public ScoreRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Score>> GetTopScoresAsync(int limit, CancellationToken cancellationToken = default)
    {
        return await _db.Scores
            .AsNoTracking()
            .OrderBy(s => s.TimeMs)
            .ThenBy(s => s.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<Score?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _db.Scores
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<Score> AddAsync(Score score, CancellationToken cancellationToken = default)
    {
        await _db.Scores.AddAsync(score, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return score;
    }
}
