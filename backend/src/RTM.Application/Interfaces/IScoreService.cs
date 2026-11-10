using RTM.Application.DTOs;

namespace RTM.Application.Interfaces;

public interface IScoreService
{
    Task<IReadOnlyList<ScoreResponse>> GetTopScoresAsync(int limit = 100, int? difficulty = null, CancellationToken cancellationToken = default);
    Task<ScoreResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ScoreResponse> CreateScoreAsync(ScoreRequest request, string? player = null, string? userId = null, CancellationToken cancellationToken = default);
}
