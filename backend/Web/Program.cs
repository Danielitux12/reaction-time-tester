using ShooterBackend.Api;
using ShooterBackend.Application;
using ShooterBackend.Infrastructure;
using ShooterBackend.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Register layers via Clean Architecture Dependency Injection extensions
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApi();

// Additional technologies: OpenAPI / Swagger & Health Checks
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "ShooterBackend API",
        Version = "v1",
        Description = "Clean Architecture API for Reaction Time Tester"
    });
});
builder.Services.AddHealthChecks();
builder.Services.AddProblemDetails();

// CORS setup
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>()
    ?? ["http://localhost:5173", "http://127.0.0.1:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler();
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ShooterBackend API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("Frontend");
app.MapHealthChecks("/health");
app.MapControllers();

// Initialize Database with retry policy (for Docker/PostgreSQL startup resilience)
using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<IDatabaseInitializer>();
    await initializer.InitializeAsync();
}

await app.RunAsync();
