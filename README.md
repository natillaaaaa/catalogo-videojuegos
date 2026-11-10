# Proyecto 2 — Catálogo de Videojuegos

**Estudiante:** Nathali Abigail Chacón Murillo

**Sistema publicado:** https://proyecto3nath.netlify.app

Catálogo de videojuegos (entidad principal **juegos**; secundarias **estudios** y **plataformas**) con servicio REST en **Netlify Functions**, base de datos en **Redis Cloud** y autenticación con **JWT**.

## Cuenta de administrador

| Correo | Contraseña |
|---|---|
| `nathali@admin.com` | `Admin12345` |

## Permisos

| Acción | Sin sesión | Usuario | Admin |
|---|---|---|---|
| Consultar | ✓ | ✓ | ✓ |
| Crear / Editar | ✗ 401 | ✓ | ✓ |
| Eliminar | ✗ 401 | ✗ 403 | ✓ |

Cualquiera puede crear una cuenta en **Registrarse** (rol `usuario`).

## Variables de entorno

Se configuran en Netlify: **Project configuration → Environment variables** (no están en el código).

| Variable | Descripción |
|---|---|
| `REDIS_URL` | Conexión a Redis Cloud: `redis://default:CONTRASEÑA@HOST:PUERTO` (Redis Cloud → base de datos → **Connect → Redis CLI**) |
| `JWT_SECRET` | Clave para firmar los tokens. Generar con: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRA` | Opcional. Duración del token (por defecto `2h`) |

Desde la terminal:

```bash
npx netlify env:set REDIS_URL "redis://default:CONTRASEÑA@HOST:PUERTO"
npx netlify env:set JWT_SECRET "CLAVE_GENERADA"
```

## Instalación y despliegue

```bash
npm install
cp .env.example .env      # completar REDIS_URL, JWT_SECRET y ADMIN_*
npm run seed              # carga los datos iniciales y crea el admin en Redis
npx netlify dev           # prueba local: http://localhost:8888
npx netlify deploy --prod # publicar
```

## Estructura

```
netlify.toml              configuración de Netlify
netlify/functions/        una función por recurso (juegos, estudios, plataformas, estadisticas, auth, api)
netlify/lib/              conexión a Redis, JWT y lógica del CRUD
scripts/cargar-redis.mjs  carga de datos iniciales
public/                   frontend en Vue.js (incluye login.html y registro.html)
```