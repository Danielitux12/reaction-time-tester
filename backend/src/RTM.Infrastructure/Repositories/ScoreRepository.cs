using Microsoft.EntityFrameworkCore;
using RTM.Domain.Entities;
using RTM.Domain.Interfaces;
using RTM.Infrastructure.Persistence;

namespace RTM.Infrastructure.Repositories;

public class ScoreRepository : IScoreRepository
{
    private readonly AppDbContext _db;

    public ScoreRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Score>> GetTopScoresAsync(int limit, int? difficulty = null, CancellationToken cancellationToken = default)
    {
        var query = _db.Scores.AsNoTracking();

        if (difficulty.HasValue)
        {
            query = query.Where(s => s.Difficulty == difficulty.Value);
        }

        return await query
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
