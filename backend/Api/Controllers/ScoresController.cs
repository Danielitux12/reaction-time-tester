using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShooterBackend.Application.DTOs;
using ShooterBackend.Application.Interfaces;

namespace ShooterBackend.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ScoresController : ControllerBase
{
    private readonly IScoreService _scoreService;

    public ScoresController(IScoreService scoreService)
    {
        _scoreService = scoreService;
    }

    /// <summary>
    /// Gets top scores ordered by reaction time (lowest first).
    /// </summary>
    /// <param name="limit">Maximum number of scores to return (1-100, default 10).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ScoreResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ScoreResponse>>> Get(
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var scores = await _scoreService.GetTopScoresAsync(limit, cancellationToken);
        return Ok(scores);
    }

    /// <summary>
    /// Gets a score by its identifier.
    /// </summary>
    /// <param name="id">Score identifier.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ScoreResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScoreResponse>> GetById(
        int id,
        CancellationToken cancellationToken = default)
    {
        var score = await _scoreService.GetByIdAsync(id, cancellationToken);
        return score is null ? NotFound() : Ok(score);
    }

    /// <summary>
    /// Records a new reaction time score.
    /// </summary>
    /// <param name="request">Score payload.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpPost]
    [ProducesResponseType(typeof(ScoreResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ScoreResponse>> Post(
        [FromBody] ScoreRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var created = await _scoreService.CreateScoreAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}
