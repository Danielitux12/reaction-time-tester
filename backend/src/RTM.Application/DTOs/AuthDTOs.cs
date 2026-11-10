using System.ComponentModel.DataAnnotations;

namespace RTM.Application.DTOs;

public sealed class RegisterRequest
{
    [Required(ErrorMessage = "El nombre de usuario es obligatorio.")]
    [StringLength(30, MinimumLength = 3, ErrorMessage = "El usuario debe tener entre 3 y 30 caracteres.")]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "El nombre de usuario solo puede contener letras, números y guión bajo (_).")]
    public string Username { get; init; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres.")]
    public string Password { get; init; } = string.Empty;
}

public sealed class LoginRequest
{
    [Required(ErrorMessage = "El nombre de usuario es obligatorio.")]
    public string Username { get; init; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    public string Password { get; init; } = string.Empty;
}

public sealed class AuthResponse
{
    public string Token { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
}
