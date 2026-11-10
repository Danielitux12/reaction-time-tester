using Microsoft.AspNetCore.Identity;

namespace RTM.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
