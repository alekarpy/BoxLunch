using Microsoft.EntityFrameworkCore;
using BoxLunch.API.Data;
using BoxLunch.API.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

// token permanente GOOGLE IA
using Microsoft.AspNetCore.DataProtection;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// --- Servicios ---
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        // Serializar enums como strings
        opts.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Configurar persistencia de claves de Data Protection en disco para producción/IIS
// CRÍTICO: Crear el directorio explícitamente para evitar errores de permisos en IIS
var keysPath = Path.Combine(builder.Environment.ContentRootPath, "App_Data", "Keys");
Directory.CreateDirectory(keysPath); // Crea si no existe (idempotente)
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(keysPath))
    .SetApplicationName("VibeServer");


// Autenticación estándar configurada en el bloque MODO REAL abajo.





// Configuración de la Base de Datos: Detectar si usar SQLite o SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<VibeDbContext>(options =>
{
    var conn = connectionString?.ToLower() ?? "";
    if (conn.Contains("server=") || conn.Contains("host=") || conn.Contains("datasource="))
    {
        options.UseSqlServer(connectionString);
    }
    else
    {
        options.UseSqlite(connectionString);
    }
    // Ignorar cambios pendientes en el modelo para permitir aplicar las migraciones existentes
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// Microsoft Graph API — lee empleados y fotos del directorio de la empresa
builder.Services.AddSingleton<GraphService>();

// --- Autenticación (Modo Portafolio) ---
// MODO PORTAFOLIO: Se reemplaza la integración con Azure AD por una autenticación simulada (Mock Login)
// para permitir que los reclutadores prueben los 3 roles del sistema sin requerir credenciales de Entra ID.
/*
var azureAd = builder.Configuration.GetSection("AzureAd");
var clientId = azureAd["ClientId"];
... (Código original de Microsoft Graph y OIDC comentado para portafolio) ...
*/

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
})
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
{
    options.Cookie.Name = "VibeAuthSession";
    options.Cookie.SameSite = builder.Environment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.Path = "/";
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.SlidingExpiration = true;
    
    // Evitar redirecciones a /Account/Login que no existe, devolver 401
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
});

// CORS: permitir peticiones desde el frontend React (producción y local) con Credenciales
var frontendOrigin = builder.Configuration["FrontendOrigin"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddPolicy("VibeFrontend", policy =>
    {
        policy
            .SetIsOriginAllowed(_ => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Crucial para permitir cookies entre diferentes orígenes
    });
});

builder.Services.AddControllers();

var app = builder.Build();

// --- PRIMERO: ForwardedHeaders para que Request.Scheme sea correcto desde el inicio ---
// CRÍTICO: Debe ir ANTES de UsePathBase y UseAuthentication para que el esquema HTTPS
// sea correcto cuando el middleware OIDC construya el redirect_uri para Azure AD.
var forwardOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
};
forwardOptions.KnownNetworks.Clear();
forwardOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardOptions);

// --- SEGUNDO: PathBase para que la app sepa que vive bajo /boxlunch/ en IIS ---
// Sin esto, las rutas de autenticación como /signin-oidc dan 404 porque IIS las bloquea.
app.UsePathBase("/boxlunch");
app.Use((context, next) => { context.Request.PathBase = "/boxlunch"; return next(); });

// --- Middleware para captura total de Errores y que no lo bloquee CORS (Fundamental) ---
app.UseExceptionHandler(e => e.Run(async context =>
{
    var exception = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
    context.Response.StatusCode = 500;
    context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
    context.Response.ContentType = "application/json";

    var errorJson = new {
        errorType = exception?.GetType().Name,
        message = exception?.Message,
        innerMessage = exception?.InnerException?.Message,
        stackTrace = exception?.StackTrace
    };
    await context.Response.WriteAsJsonAsync(errorJson);
}));

// --- Middleware ---
// Interceptar PNA (Private Network Access) para Chrome antes del middleware de CORS
app.Use(async (context, next) =>
{
    if (context.Request.Headers.TryGetValue("Access-Control-Request-Private-Network", out var isPna) && isPna == "true")
    {
        context.Response.Headers.Append("Access-Control-Allow-Private-Network", "true");
    }
    await next();
});

// CORS debe ir lo más arriba posible para manejar preflights (OPTIONS)
app.UseCors("VibeFrontend");

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers().RequireAuthorization();

    // Aplicar migraciones y asegurar que la BD tiene datos iniciales para la demo
    try
    {
        using (var scope = app.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            var db = services.GetRequiredService<VibeDbContext>();
            
            // 1. Asegurar que la base de datos existe y tiene las tablas
            if (db.Database.IsSqlite())
            {
                db.Database.EnsureCreated();
            }
            else 
            {
                // Aplicar migraciones pendientes automáticamente en SQL Server
                db.Database.Migrate();
            }

            // 2. Sembrar Roles del Sistema para Demo
            var rolAdminId = Guid.Parse("11111111-0000-0000-0000-000000000001");
            var rolOperativoId = Guid.Parse("11111111-0000-0000-0000-000000000002");
            var rolDevId = Guid.Parse("11111111-0000-0000-0000-000000000003");

            if (!db.RolesDelSistema.Any())
            {
                db.RolesDelSistema.AddRange(new List<BoxLunch.API.Models.RolDelSistema>
                {
                    new() { Id = rolAdminId, NombreDeRol = "Administrador", Descripcion = "Acceso completo" },
                    new() { Id = rolOperativoId, NombreDeRol = "Operativo", Descripcion = "Gestión de Cocina" },
                    new() { Id = rolDevId, NombreDeRol = "Desarrollador", Descripcion = "Acceso técnico" }
                });
                db.SaveChanges();
            }

            // 3. Limpiar datos viejos si tienen IDs incorrectos (ej. "EMP-1001" o cuentas demo sin EntraObjectId)
            var hasMismatchedIds = db.Empleados.Any(e => e.EntraObjectId != null && e.EntraObjectId.StartsWith("EMP-100"));
            var hasMissingDemoIds = db.Empleados.Any(e => (e.Email == "admin@demo.com" || e.Email == "operativo@demo.com") && e.EntraObjectId == null);
            if (hasMismatchedIds || hasMissingDemoIds)
            {
                db.Pedidos.RemoveRange(db.Pedidos);
                db.Notificaciones.RemoveRange(db.Notificaciones);
                db.AsignacionesRolUsuario.RemoveRange(db.AsignacionesRolUsuario);
                db.Empleados.RemoveRange(db.Empleados);
                db.SaveChanges();
            }

            // 4. Sembrar Usuarios y Empleados Demo
            var usersToSeed = new[] {
                new { Email = "admin@demo.com", Name = "Administrador Demo", Role = rolAdminId, Oid = "demo-admin" },
                new { Email = "operativo@demo.com", Name = "Operativo Cocina Demo", Role = rolOperativoId, Oid = "demo-operativo" },
                new { Email = "desarrollador@demo.com", Name = "Desarrollador Demo", Role = rolDevId, Oid = "demo-desarrollador" }
            };

            foreach(var u in usersToSeed)
            {
                // Asignación de Rol
                if (!db.AsignacionesRolUsuario.Any(a => a.CorreoElectronico == u.Email))
                {
                    db.AsignacionesRolUsuario.Add(new BoxLunch.API.Models.AsignacionRolUsuario { CorreoElectronico = u.Email, Nombre = u.Name, RolDelSistemaId = u.Role, EstadoActivo = true });
                }

                // Empleado (para poder hacer pedidos)
                if (!db.Empleados.Any(e => e.Email == u.Email))
                {
                    db.Empleados.Add(new BoxLunch.API.Models.Empleado { Email = u.Email, NombreCompleto = u.Name, EntraObjectId = u.Oid });
                }
            }
            db.SaveChanges();

            // 5. Sembrar Pedidos de Demo y Empleados desde Graph
            if (!db.Pedidos.Any())
            {
                var random = new Random(42);
                var today = DateTime.Today;
                
                // Obtener los mismos 100 empleados de GraphService para que coincidan IDs y fotos
                var graphService = services.GetRequiredService<BoxLunch.API.Services.GraphService>();
                var graphUsers = await graphService.GetAllUsersAsync();

                var newEmps = new List<BoxLunch.API.Models.Empleado>();
                foreach (var u in graphUsers)
                {
                    if (!db.Empleados.Any(e => e.Email == u.Email))
                    {
                        var emp = new BoxLunch.API.Models.Empleado 
                        { 
                            Email = u.Email, 
                            NombreCompleto = u.NombreCompleto, 
                            EntraObjectId = u.Id 
                        };
                        db.Empleados.Add(emp);
                        newEmps.Add(emp);
                    }
                }
                db.SaveChanges();

                // Recargar todos los empleados activos de la BD para asociar los pedidos (excluyendo cuentas demo de sistema)
                var allActiveEmps = db.Empleados
                    .Where(e => e.Email != "admin@demo.com" && 
                                e.Email != "operativo@demo.com" && 
                                e.Email != "desarrollador@demo.com")
                    .ToList();

                var statusList = new[] { "Pendiente", "Aprobado", "Entregado", "Cancelado" };
                var typeList = new[] { "Ordinario", "Tiempo Extra" };
                
                // Variedad de notas más amplia, eliminando "para la junta de las 12" para evitar conflictos con la hora
                var notesList = new[] { 
                    "Sin cebolla por favor", 
                    "Extra picante", 
                    "Entregar en recepción", 
                    "Llamar al llegar", 
                    "Alergia a las nueces", 
                    "Llevar servilletas extra", 
                    "Sin cubiertos", 
                    "Para el evento del piso 3", 
                    "Entregar en puerta trasera", 
                    "Mesa 5, área común", 
                    "Dejar con guardia en turno", 
                    "Separar los ingredientes", 
                    "Bebida sin hielo",
                    "Aderezo por separado",
                    "Calentar bien antes de entregar",
                    "Llevar cambio de $200",
                    "Preguntar por Juan en entrada",
                    "Sin aderezo de mostaza",
                    "Pan integral de preferencia",
                    "Para el comedor del mezanine",
                    "Dejar en la barra de café",
                    "Alergia a mariscos",
                    "Extra aderezo chipotle",
                    "Entregar con el encargado de turno",
                    "Sin tomate",
                    "Favor de colocar etiqueta con nombre"
                };

                // Horas de entrega de 6:00 AM a 6:00 PM en intervalos de 30 minutos
                var horasDisponibles = new List<string>();
                for (int hour = 6; hour <= 18; hour++)
                {
                    string hStr = hour.ToString("D2");
                    horasDisponibles.Add($"{hStr}:00");
                    if (hour < 18)
                    {
                        horasDisponibles.Add($"{hStr}:30");
                    }
                }
                
                var pedidos = new List<BoxLunch.API.Models.Pedido>();
                for(int i=0; i < 100; i++) {
                    var emp = allActiveEmps[random.Next(allActiveEmps.Count)];
                    var dateOffset = random.Next(-14, 5); // From 14 days ago to 5 days in future
                    
                    BoxLunch.API.Models.EstatusPedido status;
                    BoxLunch.API.Models.MotivoCancelacion? motivoCancelacion = null;
                    string? motivoCancelacionTexto = null;

                    if (dateOffset >= 0)
                    {
                        // Pedidos futuros o de hoy: Pendiente (90%) o Cancelado (10%)
                        status = (random.Next(10) == 0) 
                            ? BoxLunch.API.Models.EstatusPedido.Cancelado 
                            : BoxLunch.API.Models.EstatusPedido.Pendiente;
                    }
                    else
                    {
                        // Pedidos pasados: Entregado (90%) o Cancelado (10%)
                        status = (random.Next(10) == 0) 
                            ? BoxLunch.API.Models.EstatusPedido.Cancelado 
                            : BoxLunch.API.Models.EstatusPedido.Entregado;
                    }

                    // Si está cancelado, agregar motivo (opcional en base de datos, mayoría sí)
                    if (status == BoxLunch.API.Models.EstatusPedido.Cancelado)
                    {
                        if (random.Next(4) > 0) // 75% tienen motivo (mayoría)
                        {
                            motivoCancelacion = (BoxLunch.API.Models.MotivoCancelacion)random.Next(6);
                            if (random.Next(2) == 0) // 50% de probabilidad de tener texto libre
                            {
                                var cancelTexts = new[] { 
                                    "El empleado notificó por la mañana", 
                                    "Se cambió el horario de la junta de trabajo", 
                                    "Pedido registrado por duplicado", 
                                    "Logística canceló la ruta de entrega", 
                                    "Se detectó un error en los ingredientes solicitados"
                                };
                                motivoCancelacionTexto = cancelTexts[random.Next(cancelTexts.Length)];
                            }
                        }
                    }

                    // Cantidad de box lunchs
                    int cantidad = 1;
                    int cantRoll = random.Next(100);
                    if (cantRoll > 95) cantidad = 4;
                    else if (cantRoll > 90) cantidad = 3;
                    else if (cantRoll > 80) cantidad = 2;

                    // Elegir hora de entrega aleatoria de la lista de intervalos
                    var horaEntrega = horasDisponibles[random.Next(horasDisponibles.Count)];

                    pedidos.Add(new BoxLunch.API.Models.Pedido {
                        PedidoNombre = "BoxLunch " + typeList[random.Next(typeList.Length)],
                        EmpleadoId = emp.Id,
                        FechaEntrega = today.AddDays(dateOffset),
                        Estatus = status,
                        FechaDeCreacion = today.AddDays(dateOffset - random.Next(1, 3)),
                        Notas = notesList[random.Next(notesList.Length)],
                        HoraEntrega = horaEntrega,
                        Cantidad = cantidad,
                        MotivoCancelacion = motivoCancelacion,
                        MotivoCancelacionTextoLibre = motivoCancelacionTexto
                    });
                }
                
                db.Pedidos.AddRange(pedidos);
                db.SaveChanges();
            }
        }
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocurrió un error al migrar o sembrar la base de datos.");
    }

app.Run();
