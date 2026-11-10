/**
 * Función Netlify del recurso /api/juegos
 *   GET|POST           /api/juegos
 *   GET|PUT|PATCH|DELETE /api/juegos/:id
 */
import { funcionEntidad } from '../lib/catalogo.mjs';

export default funcionEntidad('juegos');

export const config = {
  path: ['/api/juegos', '/api/juegos/*'],
};
