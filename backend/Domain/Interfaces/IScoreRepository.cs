using ShooterBackend.Domain.Entities;

namespace ShooterBackend.Domain.Interfaces;

public interface IScoreRepository
{
    Task<IReadOnlyList<Score>> GetTopScoresAsync(int limit, CancellationToken cancellationToken = default);
    Task<Score?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Score> AddAsync(Score score, CancellationToken cancellationToken = default);
}
