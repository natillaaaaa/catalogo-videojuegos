/**
 * Función Netlify: GET /api/estadisticas  — resumen agregado del catálogo.
 */
import { manejar, RespuestaError } from '../lib/http.mjs';
import { estadisticas } from '../lib/catalogo.mjs';

export default manejar(async (request) => {
  if (request.method !== 'GET') {
    throw new RespuestaError(405, `El método ${request.method} no está permitido en este recurso.`, undefined, { Allow: 'GET' });
  }
  return estadisticas();
});

export const config = {
  path: '/api/estadisticas',
};
