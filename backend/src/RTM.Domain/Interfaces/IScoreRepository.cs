using RTM.Domain.Entities;

namespace RTM.Domain.Interfaces;

public interface IScoreRepository
{
    Task<IReadOnlyList<Score>> GetTopScoresAsync(int limit, int? difficulty = null, CancellationToken cancellationToken = default);
    Task<Score?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Score> AddAsync(Score score, CancellationToken cancellationToken = default);
}
