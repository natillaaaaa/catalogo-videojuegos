#!/usr/bin/env node
/**
 * =====================================================================
 *  Carga los datos del Proyecto 1 en Redis Cloud.
 *
 *  Uso (lee REDIS_URL del archivo .env):
 *    npm run seed                -> borra el catálogo y lo vuelve a cargar
 *
 *  Opcional: si en .env existen ADMIN_NOMBRE, ADMIN_CORREO y ADMIN_CLAVE,
 *  crea (o actualiza) un usuario administrador con esos datos.
 *  Los usuarios ya registrados no se borran.
 * =====================================================================
 */

import { createClient } from 'redis';
import bcrypt from 'bcryptjs';
import { estudios, plataformas, juegos } from '../datos/semilla.mjs';

const url = process.env.REDIS_URL;
if (!url) {
  console.error('✗ Falta REDIS_URL. Crea el archivo .env a partir de .env.example.');
  process.exit(1);
}

const P = 'catalogo';
const ahora = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

const db = createClient({ url });
db.on('error', (e) => console.error('[redis]', e.message));
await db.connect();
console.log('✓ Conectado a Redis');

const lotes = { estudios, plataformas, juegos };

for (const [entidad, registros] of Object.entries(lotes)) {
  const clave = `${P}:${entidad}`;
  const transaccion = db.multi().del(clave);

  for (const r of registros) {
    transaccion.hSet(clave, String(r.id), JSON.stringify({ ...r, creado_en: ahora(), actualizado_en: null }));
  }
  // El contador continúa desde el id más alto para que los nuevos no choquen.
  transaccion.set(`${P}:seq:${entidad}`, String(Math.max(...registros.map((r) => r.id))));
  await transaccion.exec();

  console.log(`✓ ${entidad.padEnd(12)} ${registros.length} registros  ->  HASH ${clave}`);
}

const { ADMIN_NOMBRE, ADMIN_CORREO, ADMIN_CLAVE } = process.env;
if (ADMIN_CORREO && ADMIN_CLAVE) {
  const correo = ADMIN_CORREO.trim().toLowerCase();
  let id = await db.hGet(`${P}:usuarios:correo`, correo);
  if (!id) {
    id = String(await db.incr(`${P}:seq:usuarios`));
    await db.hSet(`${P}:usuarios:correo`, correo, id);
  }
  const usuario = {
    id: Number(id),
    nombre: ADMIN_NOMBRE || 'Administrador',
    correo,
    hash: await bcrypt.hash(ADMIN_CLAVE, 10),
    rol: 'admin',
    creado_en: ahora(),
  };
  await db.hSet(`${P}:usuarios`, id, JSON.stringify(usuario));
  console.log(`✓ usuario admin  ${correo} (id ${id})`);
}

await db.quit();
console.log('Listo.');
