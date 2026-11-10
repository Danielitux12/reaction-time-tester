using RTM.Application.DTOs;

namespace RTM.Application.Interfaces;

public interface IScoreService
{
    Task<IReadOnlyList<ScoreResponse>> GetTopScoresAsync(int limit = 10, CancellationToken cancellationToken = default);
    Task<ScoreResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ScoreResponse> CreateScoreAsync(ScoreRequest request, CancellationToken cancellationToken = default);
}
