using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace BoxLunch.API.Controllers;

[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public class MockAuthController(IConfiguration config) : ControllerBase
{
    [HttpGet("mock-login")]
    public async Task<IActionResult> MockLogin([FromQuery] string role = "Empleado")
    {
        string email = "desarrollador@demo.com";
        string displayName = "Usuario de Prueba";
        string oid = "demo-desarrollador";

        switch (role.ToLower())
        {
            case "admin":
                email = "admin@demo.com";
                displayName = "Administrador Demo";
                oid = "demo-admin";
                break;
            case "operativo":
                email = "operativo@demo.com";
                displayName = "Operativo Cocina Demo";
                oid = "demo-operativo";
                break;
            case "desarrollador":
            default:
                email = "desarrollador@demo.com";
                displayName = "Desarrollador Demo";
                oid = "demo-desarrollador";
                break;
        }

        var claims = new List<Claim>
        {
            new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn", email),
            new Claim("preferred_username", email),
            new Claim("name", displayName),
            new Claim("oid", oid),
            new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", email),
            new Claim(ClaimTypes.Name, email)
        };

        var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var authProperties = new AuthenticationProperties
        {
            IsPersistent = true,
            ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7)
        };

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme, 
            new ClaimsPrincipal(claimsIdentity), 
            authProperties);

        string redirectUrl = GetRedirectUrl();
        return Redirect(redirectUrl);
    }

    [HttpGet("mock-logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        string redirectUrl = GetRedirectUrl();
        return Redirect(redirectUrl);
    }

    private string GetRedirectUrl()
    {
        var frontendOrigin = config["FrontendOrigin"];
        if (!string.IsNullOrEmpty(frontendOrigin))
        {
            frontendOrigin = frontendOrigin.TrimEnd('/');
            return Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" 
                ? $"{frontendOrigin}/" 
                : $"{frontendOrigin}/boxlunch/";
        }

        var referer = Request.Headers["Referer"].ToString();
        if (!string.IsNullOrEmpty(referer) && Uri.TryCreate(referer, UriKind.Absolute, out var refererUri))
        {
            var origin = $"{refererUri.Scheme}://{refererUri.Authority}";
            return Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" 
                ? $"{origin}/" 
                : $"{origin}/boxlunch/";
        }

        if (Request.Headers.TryGetValue("Host", out var hostHeader) && !string.IsNullOrEmpty(hostHeader))
        {
            var scheme = Request.Scheme;
            var origin = $"{scheme}://{hostHeader}";
            return Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" 
                ? $"{origin}/" 
                : $"{origin}/boxlunch/";
        }

        return Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" 
            ? "http://localhost:5173/" 
            : "/boxlunch/";
    }
}
