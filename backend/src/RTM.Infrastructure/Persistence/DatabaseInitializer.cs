using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;

namespace RTM.Infrastructure.Persistence;

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
                var created = await _db.Database.EnsureCreatedAsync(cancellationToken);
                if (!created)
                {
                    var databaseCreator = _db.Database.GetService<IRelationalDatabaseCreator>();
                    if (!await databaseCreator.HasTablesAsync(cancellationToken))
                    {
                        await databaseCreator.CreateTablesAsync(cancellationToken);
                    }
                }
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
