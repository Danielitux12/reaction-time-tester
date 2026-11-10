using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ShooterBackend.Infrastructure.Persistence;

public class DatabaseInitializer : IDatabaseInitializer
{
    private readonly AppDbContext _db;
    private readonly ILogger<DatabaseInitializer> _logger;

    public DatabaseInitializer(AppDbContext db, ILogger<DatabaseInitializer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        const int maxAttempts = 15;
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                _logger.LogInformation("Attempting database initialization (attempt {Attempt}/{MaxAttempts})...", attempt, maxAttempts);
                await _db.Database.EnsureCreatedAsync(cancellationToken);
                _logger.LogInformation("Database initialized successfully.");
                return;
            }
            catch (Exception ex) when (attempt < maxAttempts)
            {
                _logger.LogWarning(ex, "Database connection failed on attempt {Attempt}/{MaxAttempts}. Retrying in 2 seconds...", attempt, maxAttempts);
                await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize database after {MaxAttempts} attempts.", maxAttempts);
                throw;
            }
        }
    }
}
