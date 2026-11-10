/**
 * Función Netlify: GET /api  — índice y documentación del servicio.
 */
import { manejar, json } from '../lib/http.mjs';

const crud = (r, extra = {}) => ({
  listar: `GET /api/${r}`,
  consultar: `GET /api/${r}/:id`,
  ...extra,
  crear: `POST /api/${r}            (requiere token)`,
  reemplazar: `PUT /api/${r}/:id        (requiere token)`,
  modificar: `PATCH /api/${r}/:id      (requiere token)`,
  eliminar: `DELETE /api/${r}/:id     (requiere token con rol admin)`,
});

export default manejar(async () =>
  json({
    servicio: 'Catálogo de Videojuegos',
    version: '2.0.0',
    descripcion: 'API REST sobre Netlify Functions y Redis Cloud, con autenticación JWT.',
    autenticacion: {
      registro: 'POST /api/auth/registro  { nombre, correo, clave }',
      login: 'POST /api/auth/login  { correo, clave }  -> { token }',
      yo: 'GET /api/auth/yo  (requiere token)',
      uso: 'Enviar el token en la cabecera  Authorization: Bearer <token>',
      permisos: {
        consultas: 'públicas',
        crear_y_editar: 'usuario autenticado (rol usuario o admin)',
        borrar: 'sólo rol admin (si no, 403)',
      },
    },
    recursos: {
      juegos: {
        ...crud('juegos'),
        listar: 'GET /api/juegos?buscar=&genero=&anio=&estudio_id=&plataforma_id=&ordenar=&direccion=&pagina=&limite=',
      },
      estudios: crud('estudios', { juegosDelEstudio: 'GET /api/estudios/:id/juegos' }),
      plataformas: crud('plataformas', { juegosDeLaPlataforma: 'GET /api/plataformas/:id/juegos' }),
      estadisticas: 'GET /api/estadisticas',
    },
  })
);

export const config = {
  path: ['/api', '/api/'],
};
