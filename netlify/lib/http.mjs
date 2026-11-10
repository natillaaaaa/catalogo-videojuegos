/**
 * =====================================================================
 *  Utilidades HTTP compartidas por todas las funciones de Netlify.
 *  Las funciones usan la API moderna de Netlify (Request -> Response),
 *  la misma interfaz Fetch que usaba el Worker del Proyecto 1.
 * =====================================================================
 */

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/** Error con código HTTP; el manejador lo convierte en respuesta JSON. */
export class RespuestaError extends Error {
  constructor(estado, mensaje, detalles, cabeceras = {}) {
    super(mensaje);
    this.estado = estado;
    this.detalles = detalles;
    this.cabeceras = cabeceras;
  }
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...CORS,
      ...extraHeaders,
    },
  });
}

export function sinContenido() {
  return new Response(null, { status: 204, headers: CORS });
}

export function error(status, mensaje, detalles, extraHeaders = {}) {
  const cuerpo = { error: true, estado: status, mensaje };
  if (detalles) cuerpo.detalles = detalles;
  return json(cuerpo, status, extraHeaders);
}

export async function leerCuerpo(request) {
  const tipo = request.headers.get('Content-Type') || '';
  if (!tipo.includes('application/json')) {
    throw new RespuestaError(415, 'El cuerpo debe enviarse como application/json.');
  }
  try {
    const cuerpo = await request.json();
    if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
      throw new Error('no es objeto');
    }
    return cuerpo;
  } catch {
    throw new RespuestaError(400, 'El cuerpo de la petición no es un objeto JSON válido.');
  }
}

/** Fecha en el mismo formato que usaba SQLite: "2026-11-10 20:15:03" (UTC). */
export function ahora() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Envuelve la lógica de una función: responde el preflight CORS y
 * transforma cualquier excepción en una respuesta JSON coherente.
 */
export function manejar(logica) {
  return async (request, context) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try {
      return await logica(request, context);
    } catch (e) {
      if (e instanceof RespuestaError) return error(e.estado, e.message, e.detalles, e.cabeceras);
      console.error(e);
      return error(500, 'Error interno del servicio.', [String(e?.message || e)]);
    }
  };
}
