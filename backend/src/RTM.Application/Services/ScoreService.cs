using RTM.Application.DTOs;
using RTM.Application.Interfaces;
using RTM.Domain.Entities;
using RTM.Domain.Interfaces;

namespace RTM.Application.Services;

public class ScoreService : IScoreService
{
    private readonly IScoreRepository _scoreRepository;

    public ScoreService(IScoreRepository scoreRepository)
    {
        _scoreRepository = scoreRepository;
    }

    public async Task<IReadOnlyList<ScoreResponse>> GetTopScoresAsync(int limit = 10, CancellationToken cancellationToken = default)
    {
        var clampedLimit = Math.Clamp(limit, 1, 100);
        var scores = await _scoreRepository.GetTopScoresAsync(clampedLimit, cancellationToken);
        return scores.Select(MapToResponse).ToList();
    }

    public async Task<ScoreResponse?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var score = await _scoreRepository.GetByIdAsync(id, cancellationToken);
        return score is null ? null : MapToResponse(score);
    }

    public async Task<ScoreResponse> CreateScoreAsync(ScoreRequest request, CancellationToken cancellationToken = default)
    {
        var score = new Score(
            player: request.Player,
            difficulty: request.Difficulty,
            timeMs: request.TimeMs,
            attempts: request.Attempts
        );

        var savedScore = await _scoreRepository.AddAsync(score, cancellationToken);
        return MapToResponse(savedScore);
    }

    private static ScoreResponse MapToResponse(Score score) => new()
    {
        Id = score.Id,
        Player = score.Player,
        Difficulty = score.Difficulty,
        TimeMs = score.TimeMs,
        Attempts = score.Attempts,
        CreatedAt = score.CreatedAt
    };
}
