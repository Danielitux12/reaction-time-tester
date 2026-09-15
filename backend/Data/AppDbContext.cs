using Microsoft.EntityFrameworkCore;
using ShooterBackend.Models;

namespace ShooterBackend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Score> Scores => Set<Score>();
}
