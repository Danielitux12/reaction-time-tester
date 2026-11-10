using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RTM.Application.DTOs;
using RTM.Application.Interfaces;

namespace RTM.Api.Controllers;

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
    /// Gets top scores ordered by reaction time (lowest first), with optional difficulty filter.
    /// Public endpoint allowed for unauthenticated visitors.
    /// </summary>
    /// <param name="limit">Maximum number of scores to return (1-100, default 100).</param>
    /// <param name="difficulty">Optional difficulty filter (1 = Facil, 2 = Medio, 3 = Dificil).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<ScoreResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ScoreResponse>>> Get(
        [FromQuery] int limit = 100,
        [FromQuery] int? difficulty = null,
        CancellationToken cancellationToken = default)
    {
        var scores = await _scoreService.GetTopScoresAsync(limit, difficulty, cancellationToken);
        return Ok(scores);
    }

    /// <summary>
    /// Gets a score by its identifier. Protected endpoint.
    /// </summary>
    /// <param name="id">Score identifier.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpGet("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(ScoreResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ScoreResponse>> GetById(
        int id,
        CancellationToken cancellationToken = default)
    {
        var score = await _scoreService.GetByIdAsync(id, cancellationToken);
        return score is null ? NotFound() : Ok(score);
    }

    /// <summary>
    /// Records a new reaction time score. Protected endpoint - requires registered user.
    /// </summary>
    /// <param name="request">Score payload.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(ScoreResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ScoreResponse>> Post(
        [FromBody] ScoreRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var username = User.Identity?.Name ?? request.Player;
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var created = await _scoreService.CreateScoreAsync(
            request,
            player: username,
            userId: userId,
            cancellationToken: cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}
