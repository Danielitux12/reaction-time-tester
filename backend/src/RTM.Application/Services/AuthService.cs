using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RTM.Application.DTOs;
using RTM.Application.Interfaces;
using RTM.Domain.Entities;

namespace RTM.Application.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;

    public AuthService(UserManager<ApplicationUser> userManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var trimmedUsername = request.Username.Trim();

        var existingUser = await _userManager.FindByNameAsync(trimmedUsername);
        if (existingUser != null)
        {
            throw new InvalidOperationException($"El nombre de usuario '{trimmedUsername}' ya está en uso.");
        }

        var user = new ApplicationUser
        {
            UserName = trimmedUsername,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Error al crear usuario: {errors}");
        }

        return GenerateAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var trimmedUsername = request.Username.Trim();

        var user = await _userManager.FindByNameAsync(trimmedUsername);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Credenciales incorrectas: usuario no encontrado.");
        }

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            throw new UnauthorizedAccessException("Credenciales incorrectas: contraseña incorrecta.");
        }

        return GenerateAuthResponse(user);
    }

    private AuthResponse GenerateAuthResponse(ApplicationUser user)
    {
        var secretKey = _configuration["Jwt:Key"]
            ?? "Shooter_Secret_Authentication_Key_2026_Top_Security_Token_Key_987654321";
        var issuer = _configuration["Jwt:Issuer"] ?? "RTM_API";
        var audience = _configuration["Jwt:Audience"] ?? "RTM_CLIENT";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiresAt = DateTime.UtcNow.AddDays(7);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Username = user.UserName ?? string.Empty,
            ExpiresAt = expiresAt
        };
    }
}
