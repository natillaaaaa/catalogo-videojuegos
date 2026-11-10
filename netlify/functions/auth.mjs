/**
 * =====================================================================
 *  Función Netlify de autenticación
 *
 *    POST /api/auth/registro   { nombre, correo, clave }  -> 201 { usuario, token, expira }
 *    POST /api/auth/login      { correo, clave }          -> 200 { usuario, token, expira }
 *    GET  /api/auth/yo         (Authorization: Bearer)    -> 200 { usuario }
 *
 *  Los usuarios se guardan en Redis:
 *    catalogo:usuarios          HASH  id -> { id, nombre, correo, hash, rol, creado_en }
 *    catalogo:usuarios:correo   HASH  correo -> id
 *
 *  El primer usuario que se registra recibe el rol "admin";
 *  los siguientes reciben el rol "usuario".
 * =====================================================================
 */

import { manejar, json, leerCuerpo, ahora, RespuestaError } from '../lib/http.mjs';
import { redis, clave } from '../lib/redis.mjs';
import { cifrarClave, compararClave, firmarToken, usuarioPublico, autenticar } from '../lib/auth.mjs';

const USUARIOS = clave('usuarios');
const POR_CORREO = clave('usuarios', 'correo');
const SECUENCIA = clave('seq', 'usuarios');

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function registro(request) {
  const cuerpo = await leerCuerpo(request);
  const nombre = String(cuerpo.nombre ?? '').trim();
  const correo = String(cuerpo.correo ?? '').trim().toLowerCase();
  const clavePlana = String(cuerpo.clave ?? '');

  const fallos = [];
  if (nombre.length < 2 || nombre.length > 80) fallos.push('El nombre debe tener entre 2 y 80 caracteres.');
  if (!CORREO_VALIDO.test(correo) || correo.length > 160) fallos.push('El correo no tiene un formato válido.');
  if (clavePlana.length < 8 || clavePlana.length > 72) fallos.push('La contraseña debe tener entre 8 y 72 caracteres.');
  if (fallos.length) throw new RespuestaError(422, 'Los datos del registro no son válidos.', fallos);

  const db = await redis();
  const hash = await cifrarClave(clavePlana);

  // Reserva el correo de forma atómica: HSETNX sólo escribe si no existe.
  const id = await db.incr(SECUENCIA);
  const reservado = await db.hSetNX(POR_CORREO, correo, String(id));
  if (!reservado) throw new RespuestaError(409, 'Ya existe una cuenta con ese correo.');

  const esPrimero = (await db.hLen(USUARIOS)) === 0;
  const usuario = { id, nombre, correo, hash, rol: esPrimero ? 'admin' : 'usuario', creado_en: ahora() };
  await db.hSet(USUARIOS, String(id), JSON.stringify(usuario));

  return json({ usuario: usuarioPublico(usuario), ...firmarToken(usuario) }, 201, { Location: '/api/auth/yo' });
}

async function login(request) {
  const cuerpo = await leerCuerpo(request);
  const correo = String(cuerpo.correo ?? '').trim().toLowerCase();
  const clavePlana = String(cuerpo.clave ?? '');
  if (!correo || !clavePlana) throw new RespuestaError(400, 'Debes indicar el correo y la contraseña.');

  const db = await redis();
  const id = await db.hGet(POR_CORREO, correo);
  const guardado = id ? await db.hGet(USUARIOS, id) : null;
  const usuario = guardado ? JSON.parse(guardado) : null;

  // Mismo mensaje en ambos casos para no revelar qué correos existen.
  if (!usuario || !(await compararClave(clavePlana, usuario.hash))) {
    throw new RespuestaError(401, 'Correo o contraseña incorrectos.');
  }

  return json({ usuario: usuarioPublico(usuario), ...firmarToken(usuario) });
}

async function yo(request) {
  const datosToken = autenticar(request);
  const db = await redis();
  const guardado = await db.hGet(USUARIOS, String(datosToken.id));
  if (!guardado) throw new RespuestaError(401, 'El usuario del token ya no existe.');
  return json({ usuario: usuarioPublico(JSON.parse(guardado)), expira: new Date(datosToken.exp * 1000).toISOString() });
}

export default manejar(async (request) => {
  const accion = new URL(request.url).pathname.split('/').filter(Boolean)[2];
  const metodo = request.method.toUpperCase();

  const rutas = { registro: ['POST', registro], login: ['POST', login], yo: ['GET', yo] };
  if (!rutas[accion]) throw new RespuestaError(404, 'Ruta de autenticación desconocida. Usa registro, login o yo.');

  const [permitido, accionar] = rutas[accion];
  if (metodo !== permitido) {
    throw new RespuestaError(405, `Usa ${permitido} en /api/auth/${accion}.`, undefined, { Allow: permitido });
  }
  return accionar(request);
});

export const config = {
  path: '/api/auth/*',
};
