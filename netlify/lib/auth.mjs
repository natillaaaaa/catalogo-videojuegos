/**
 * =====================================================================
 *  Autenticación con JSON Web Tokens
 *
 *  - Las contraseñas se guardan con bcrypt (nunca en texto plano).
 *  - El token se firma con HS256 usando la clave JWT_SECRET, que se
 *    configura como variable de entorno en Netlify.
 *  - El token lleva la identidad del usuario (sub, nombre, correo, rol)
 *    y la fecha de expiración (exp).
 *  - El cliente lo envía en la cabecera  Authorization: Bearer <token>
 * =====================================================================
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RespuestaError } from './http.mjs';

const RONDAS_BCRYPT = 10;

function claveSecreta() {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) {
    throw new RespuestaError(500, 'Falta la variable de entorno JWT_SECRET con la clave de firma de los tokens.');
  }
  return secreto;
}

export const cifrarClave = (clave) => bcrypt.hash(clave, RONDAS_BCRYPT);
export const compararClave = (clave, hash) => bcrypt.compare(clave, hash);

/** Genera el JWT firmado para un usuario. */
export function firmarToken(usuario) {
  const expiresIn = process.env.JWT_EXPIRA || '2h';
  const token = jwt.sign(
    { nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
    claveSecreta(),
    { subject: String(usuario.id), expiresIn, algorithm: 'HS256' }
  );
  const { exp } = jwt.decode(token);
  return { token, expira: new Date(exp * 1000).toISOString() };
}

/** Datos públicos de un usuario (sin el hash de la contraseña). */
export function usuarioPublico(u) {
  const { hash, ...resto } = u;
  return resto;
}

const noAutorizado = (mensaje) =>
  new RespuestaError(401, mensaje, undefined, { 'WWW-Authenticate': 'Bearer realm="catalogo"' });

/**
 * Valida la firma y la expiración del token de la petición.
 * Devuelve el usuario del token o lanza 401.
 */
export function autenticar(request) {
  const cabecera = request.headers.get('Authorization') || '';
  const [tipo, token] = cabecera.split(' ');

  if (!token || tipo !== 'Bearer') {
    throw noAutorizado('Debes iniciar sesión: falta el token (Authorization: Bearer <token>).');
  }

  try {
    const datos = jwt.verify(token, claveSecreta(), { algorithms: ['HS256'] });
    return { id: Number(datos.sub), nombre: datos.nombre, correo: datos.correo, rol: datos.rol, exp: datos.exp };
  } catch (e) {
    if (e instanceof RespuestaError) throw e;
    if (e.name === 'TokenExpiredError') throw noAutorizado('La sesión expiró. Inicia sesión de nuevo.');
    throw noAutorizado('El token no es válido.');
  }
}

/** Lanza 403 si el usuario no tiene alguno de los roles indicados. */
export function exigirRol(usuario, ...roles) {
  if (!roles.includes(usuario.rol)) {
    throw new RespuestaError(403, `No tienes permiso para esta operación. Se requiere el rol: ${roles.join(' o ')}.`);
  }
}
