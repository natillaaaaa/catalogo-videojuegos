/**
 * =====================================================================
 *  Conexión a Redis Cloud
 *
 *  La cadena de conexión llega por la variable de entorno REDIS_URL
 *  (configurada en Netlify, nunca escrita en el código).
 *
 *  La conexión se guarda en una variable del módulo: mientras Netlify
 *  mantenga "caliente" la instancia de la función, las invocaciones
 *  siguientes reutilizan el mismo cliente en lugar de abrir otro.
 *
 *  Modelo de datos en Redis
 *  ------------------------
 *  Cada entidad es un HASH y cada registro es un valor (JSON) del hash,
 *  cuyo campo es el id del registro:
 *
 *    catalogo:juegos        { "1": "{...juego 1...}", "2": "{...}", ... }
 *    catalogo:estudios      { "1": "{...estudio 1...}", ... }
 *    catalogo:plataformas   { "1": "{...plataforma 1...}", ... }
 *    catalogo:usuarios      { "1": "{...usuario 1...}", ... }
 *
 *  Índices y contadores auxiliares:
 *    catalogo:usuarios:correo   HASH  correo -> id   (correo único)
 *    catalogo:seq:<entidad>     STRING contador para generar ids (INCR)
 *
 *  Las relaciones se guardan como referencias: cada juego tiene
 *  estudio_id y plataforma_id con el id del registro relacionado.
 * =====================================================================
 */

import { createClient } from 'redis';
import { RespuestaError } from './http.mjs';

export const PREFIJO = 'catalogo';
export const clave = (...partes) => [PREFIJO, ...partes].join(':');

let conexion = null; // Promise<RedisClient> reutilizada entre invocaciones

export function redis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new RespuestaError(500, 'Falta la variable de entorno REDIS_URL con la conexión a Redis Cloud.');
  }

  if (!conexion) {
    const cliente = createClient({
      url,
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (intentos) => (intentos > 5 ? false : Math.min(intentos * 200, 2000)),
      },
    });
    cliente.on('error', (e) => console.error('[redis]', e.message));

    conexion = cliente
      .connect()
      .then(() => cliente)
      .catch((e) => {
        conexion = null; // la próxima invocación lo vuelve a intentar
        throw new RespuestaError(503, 'No se pudo conectar con Redis Cloud.', [e.message]);
      });
  }
  return conexion;
}
