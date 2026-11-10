/**
 * Función Netlify del recurso /api/estudios
 *   GET|POST           /api/estudios
 *   GET|PUT|PATCH|DELETE /api/estudios/:id
 *   GET                /api/estudios/:id/juegos
 */
import { funcionEntidad } from '../lib/catalogo.mjs';

export default funcionEntidad('estudios');

export const config = {
  path: ['/api/estudios', '/api/estudios/*'],
};
