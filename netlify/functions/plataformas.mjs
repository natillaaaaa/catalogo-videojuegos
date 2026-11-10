/**
 * Función Netlify del recurso /api/plataformas
 *   GET|POST           /api/plataformas
 *   GET|PUT|PATCH|DELETE /api/plataformas/:id
 *   GET                /api/plataformas/:id/juegos
 */
import { funcionEntidad } from '../lib/catalogo.mjs';

export default funcionEntidad('plataformas');

export const config = {
  path: ['/api/plataformas', '/api/plataformas/*'],
};
