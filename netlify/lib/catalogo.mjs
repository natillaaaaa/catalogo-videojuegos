/**
 * =====================================================================
 *  Catálogo de Videojuegos — lógica del servicio REST sobre Redis
 *
 *  Mantiene exactamente el mismo comportamiento del Proyecto 1:
 *    GET    /api/<recurso>        -> lista (búsqueda, filtros, orden, paginación)
 *    GET    /api/<recurso>/:id    -> consulta individual
 *    POST   /api/<recurso>        -> crea (201 + cabecera Location)
 *    PUT    /api/<recurso>/:id    -> reemplaza el registro completo
 *    PATCH  /api/<recurso>/:id    -> modifica campos puntuales
 *    DELETE /api/<recurso>/:id    -> elimina (204 sin contenido)
 *    GET    /api/estudios/:id/juegos · /api/plataformas/:id/juegos
 *
 *  Permisos (diseño del Proyecto 2):
 *    - Consultas (GET): públicas.
 *    - Crear y editar (POST, PUT, PATCH): cualquier usuario autenticado.
 *    - Borrar (DELETE): sólo usuarios con rol "admin"  -> si no, 403.
 * =====================================================================
 */

import { RespuestaError, json, sinContenido, leerCuerpo, ahora, manejar } from './http.mjs';
import { redis, clave } from './redis.mjs';
import { autenticar, exigirRol } from './auth.mjs';

/* ------------------------------------------------------------------ */
/*  Definición de las entidades                                        */
/* ------------------------------------------------------------------ */

export const ENTIDADES = {
  juegos: {
    etiqueta: 'juego',
    ordenPorDefecto: 'titulo',
    ordenables: ['id', 'titulo', 'anio', 'calificacion', 'precio', 'creado_en'],
    buscarEn: ['titulo', 'genero', 'descripcion'],
    filtros: ['estudio_id', 'plataforma_id', 'genero', 'anio'],
    campos: {
      titulo:        { tipo: 'texto',   requerido: true,  max: 160 },
      anio:          { tipo: 'entero',  requerido: true,  min: 1958, max: 2100 },
      genero:        { tipo: 'texto',   requerido: true,  max: 80 },
      calificacion:  { tipo: 'entero',  requerido: false, min: 0, max: 100 },
      precio:        { tipo: 'decimal', requerido: false, min: 0, max: 100000 },
      descripcion:   { tipo: 'texto',   requerido: false, max: 2000 },
      imagen:        { tipo: 'texto',   requerido: false, max: 500 },
      estudio_id:    { tipo: 'entero',  requerido: false, referencia: 'estudios' },
      plataforma_id: { tipo: 'entero',  requerido: false, referencia: 'plataformas' },
    },
  },
  estudios: {
    etiqueta: 'estudio',
    ordenPorDefecto: 'nombre',
    ordenables: ['id', 'nombre', 'pais', 'anio_fundacion', 'creado_en'],
    buscarEn: ['nombre', 'pais', 'fundador', 'descripcion'],
    filtros: ['pais'],
    campos: {
      nombre:         { tipo: 'texto',  requerido: true,  max: 160 },
      pais:           { tipo: 'texto',  requerido: true,  max: 80 },
      anio_fundacion: { tipo: 'entero', requerido: true,  min: 1900, max: 2100 },
      fundador:       { tipo: 'texto',  requerido: false, max: 160 },
      sitio_web:      { tipo: 'texto',  requerido: false, max: 300 },
      descripcion:    { tipo: 'texto',  requerido: false, max: 2000 },
      imagen:         { tipo: 'texto',  requerido: false, max: 500 },
    },
  },
  plataformas: {
    etiqueta: 'plataforma',
    ordenPorDefecto: 'nombre',
    ordenables: ['id', 'nombre', 'fabricante', 'anio_lanzamiento', 'unidades_vendidas', 'creado_en'],
    buscarEn: ['nombre', 'fabricante', 'generacion', 'descripcion'],
    filtros: ['fabricante'],
    campos: {
      nombre:            { tipo: 'texto',   requerido: true,  max: 160 },
      fabricante:        { tipo: 'texto',   requerido: true,  max: 120 },
      anio_lanzamiento:  { tipo: 'entero',  requerido: true,  min: 1958, max: 2100 },
      generacion:        { tipo: 'texto',   requerido: false, max: 60 },
      unidades_vendidas: { tipo: 'decimal', requerido: false, min: 0, max: 100000 },
      descripcion:       { tipo: 'texto',   requerido: false, max: 2000 },
      imagen:            { tipo: 'texto',   requerido: false, max: 500 },
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Acceso a Redis                                                     */
/* ------------------------------------------------------------------ */

const claveEntidad = (entidad) => clave(entidad);          // catalogo:juegos
const claveSecuencia = (entidad) => clave('seq', entidad); // catalogo:seq:juegos

/** Todos los registros de una entidad (HVALS). */
async function todos(db, entidad) {
  const valores = await db.hVals(claveEntidad(entidad));
  return valores.map((v) => JSON.parse(v));
}

/** Un registro por id (HGET) o null. */
async function buscarPorId(db, entidad, id) {
  const valor = await db.hGet(claveEntidad(entidad), String(id));
  return valor ? JSON.parse(valor) : null;
}

/** Diccionario id -> registro, para resolver relaciones. */
async function mapa(db, entidad) {
  const todo = await db.hGetAll(claveEntidad(entidad));
  const resultado = new Map();
  for (const [id, valor] of Object.entries(todo)) resultado.set(Number(id), JSON.parse(valor));
  return resultado;
}

/** Ordena las propiedades igual que las columnas del Proyecto 1. */
function normalizar(entidad, registro) {
  const salida = { id: registro.id };
  for (const campo of Object.keys(ENTIDADES[entidad].campos)) salida[campo] = registro[campo] ?? null;
  salida.creado_en = registro.creado_en ?? null;
  salida.actualizado_en = registro.actualizado_en ?? null;
  return salida;
}

/* ------------------------------------------------------------------ */
/*  Validación                                                         */
/* ------------------------------------------------------------------ */

function validar(entidad, datos, { parcial }) {
  const definicion = ENTIDADES[entidad].campos;
  const limpio = {};
  const fallos = [];

  for (const [campo, regla] of Object.entries(definicion)) {
    const presente = Object.prototype.hasOwnProperty.call(datos, campo);

    if (!presente) {
      if (regla.requerido && !parcial) fallos.push(`Falta el campo obligatorio "${campo}".`);
      continue;
    }

    let valor = datos[campo];

    // Un nulo explícito borra el valor, salvo en campos obligatorios.
    if (valor === null || valor === '') {
      if (regla.requerido) fallos.push(`El campo "${campo}" no puede quedar vacío.`);
      else limpio[campo] = null;
      continue;
    }

    if (regla.tipo === 'texto') {
      valor = String(valor).trim();
      if (!valor && regla.requerido) { fallos.push(`El campo "${campo}" no puede quedar vacío.`); continue; }
      if (regla.max && valor.length > regla.max) {
        fallos.push(`El campo "${campo}" supera los ${regla.max} caracteres.`); continue;
      }
    }

    if (regla.tipo === 'entero' || regla.tipo === 'decimal') {
      const numero = Number(valor);
      if (!Number.isFinite(numero)) { fallos.push(`El campo "${campo}" debe ser numérico.`); continue; }
      valor = regla.tipo === 'entero' ? Math.trunc(numero) : numero;
      if (regla.min !== undefined && valor < regla.min) {
        fallos.push(`El campo "${campo}" no puede ser menor que ${regla.min}.`); continue;
      }
      if (regla.max !== undefined && valor > regla.max) {
        fallos.push(`El campo "${campo}" no puede ser mayor que ${regla.max}.`); continue;
      }
    }

    limpio[campo] = valor;
  }

  if (fallos.length) throw new RespuestaError(422, 'Los datos enviados no son válidos.', fallos);
  if (!Object.keys(limpio).length) throw new RespuestaError(400, 'No se envió ningún campo modificable.');

  return limpio;
}

/** Comprueba que las referencias apunten a registros existentes (HEXISTS). */
async function verificarReferencias(db, entidad, datos) {
  const fallos = [];
  for (const [campo, regla] of Object.entries(ENTIDADES[entidad].campos)) {
    if (!regla.referencia) continue;
    const valor = datos[campo];
    if (valor === undefined || valor === null) continue;
    const existe = await db.hExists(claveEntidad(regla.referencia), String(valor));
    if (!existe) fallos.push(`No existe ningún registro de "${regla.referencia}" con id ${valor}.`);
  }
  if (fallos.length) throw new RespuestaError(409, 'Hay referencias que no existen.', fallos);
}

/* ------------------------------------------------------------------ */
/*  Formato de salida                                                  */
/* ------------------------------------------------------------------ */

/** Añade relaciones anidadas y enlaces de navegación. */
function formatear(entidad, registro, relaciones) {
  const r = normalizar(entidad, registro);

  if (entidad !== 'juegos') {
    return { ...r, _enlaces: { self: `/api/${entidad}/${r.id}`, juegos: `/api/${entidad}/${r.id}/juegos` } };
  }

  const e = r.estudio_id ? relaciones.estudios.get(r.estudio_id) : null;
  const p = r.plataforma_id ? relaciones.plataformas.get(r.plataforma_id) : null;

  return {
    ...r,
    estudio: e ? { id: e.id, nombre: e.nombre, pais: e.pais, imagen: e.imagen ?? null } : null,
    plataforma: p ? { id: p.id, nombre: p.nombre, fabricante: p.fabricante, imagen: p.imagen ?? null } : null,
    _enlaces: {
      self: `/api/juegos/${r.id}`,
      estudio: r.estudio_id ? `/api/estudios/${r.estudio_id}` : null,
      plataforma: r.plataforma_id ? `/api/plataformas/${r.plataforma_id}` : null,
    },
  };
}

async function relacionesDeJuegos(db) {
  const [estudios, plataformas] = await Promise.all([mapa(db, 'estudios'), mapa(db, 'plataformas')]);
  return { estudios, plataformas };
}

/* ------------------------------------------------------------------ */
/*  Búsqueda y orden en memoria                                        */
/* ------------------------------------------------------------------ */

const sinAcentos = (texto) =>
  String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Igual que en SQL: los nulos van primero en orden ascendente. */
function comparar(a, b, campo) {
  const x = a[campo];
  const y = b[campo];
  if (x === y) return a.id - b.id;
  if (x === null || x === undefined) return -1;
  if (y === null || y === undefined) return 1;
  if (typeof x === 'number' && typeof y === 'number') return x - y;
  return String(x).localeCompare(String(y), 'es', { sensitivity: 'base' }) || a.id - b.id;
}

/* ------------------------------------------------------------------ */
/*  Operaciones                                                        */
/* ------------------------------------------------------------------ */

async function listar(db, entidad, url) {
  const cfg = ENTIDADES[entidad];
  const params = url.searchParams;
  let registros = (await todos(db, entidad)).map((r) => normalizar(entidad, r));

  // Búsqueda de texto libre (sin distinguir mayúsculas ni acentos)
  const buscar = sinAcentos((params.get('buscar') || '').trim());
  if (buscar) {
    registros = registros.filter((r) => cfg.buscarEn.some((c) => sinAcentos(r[c]).includes(buscar)));
  }

  // Filtros por relación y por campo
  for (const filtro of cfg.filtros) {
    const valor = params.get(filtro);
    if (valor === null || valor === '') continue;
    const esperado = cfg.campos[filtro].tipo === 'texto' ? valor : Number(valor);
    registros = registros.filter((r) => r[filtro] === esperado);
  }

  // Ordenamiento (sólo campos de la lista blanca)
  let ordenar = params.get('ordenar') || cfg.ordenPorDefecto;
  if (!cfg.ordenables.includes(ordenar)) ordenar = cfg.ordenPorDefecto;
  const signo = (params.get('direccion') || 'asc').toLowerCase() === 'desc' ? -1 : 1;
  registros.sort((a, b) => signo * comparar(a, b, ordenar));

  // Paginación
  const limite = Math.min(Math.max(parseInt(params.get('limite') || '100', 10) || 100, 1), 200);
  const pagina = Math.max(parseInt(params.get('pagina') || '1', 10) || 1, 1);
  const total = registros.length;
  const pagina_datos = registros.slice((pagina - 1) * limite, pagina * limite);

  const relaciones = entidad === 'juegos' ? await relacionesDeJuegos(db) : null;

  return json({
    total,
    pagina,
    limite,
    paginas: Math.max(Math.ceil(total / limite), 1),
    datos: pagina_datos.map((r) => formatear(entidad, r, relaciones)),
  });
}

async function obtener(db, entidad, id) {
  const registro = await buscarPorId(db, entidad, id);
  if (!registro) throw new RespuestaError(404, `No existe ningún ${ENTIDADES[entidad].etiqueta} con id ${id}.`);
  return registro;
}

async function respuestaRegistro(db, entidad, registro, status = 200, cabeceras = {}) {
  const relaciones = entidad === 'juegos' ? await relacionesDeJuegos(db) : null;
  return json(formatear(entidad, registro, relaciones), status, cabeceras);
}

async function crear(db, entidad, request) {
  const cuerpo = await leerCuerpo(request);
  const datos = validar(entidad, cuerpo, { parcial: false });
  await verificarReferencias(db, entidad, datos);

  const id = await db.incr(claveSecuencia(entidad)); // id autoincremental
  const registro = normalizar(entidad, { ...datos, id, creado_en: ahora(), actualizado_en: null });

  await db.hSet(claveEntidad(entidad), String(id), JSON.stringify(registro));
  return respuestaRegistro(db, entidad, registro, 201, { Location: `/api/${entidad}/${id}` });
}

async function actualizar(db, entidad, id, request, { parcial }) {
  const actual = await obtener(db, entidad, id); // 404 si no existe

  const cuerpo = await leerCuerpo(request);
  const datos = validar(entidad, cuerpo, { parcial });
  await verificarReferencias(db, entidad, datos);

  // PUT reemplaza: los campos opcionales que no vengan se vacían.
  if (!parcial) {
    for (const [campo, regla] of Object.entries(ENTIDADES[entidad].campos)) {
      if (!regla.requerido && !(campo in datos)) datos[campo] = null;
    }
  }

  const registro = normalizar(entidad, { ...actual, ...datos, id, actualizado_en: ahora() });
  await db.hSet(claveEntidad(entidad), String(id), JSON.stringify(registro));
  return respuestaRegistro(db, entidad, registro);
}

async function eliminar(db, entidad, id) {
  await obtener(db, entidad, id); // 404 si no existe

  const transaccion = db.multi();

  // Al borrar un estudio o una plataforma, sus juegos quedan sin esa
  // referencia en lugar de desaparecer (equivale a ON DELETE SET NULL).
  const referencia = { estudios: 'estudio_id', plataformas: 'plataforma_id' }[entidad];
  if (referencia) {
    for (const juego of await todos(db, 'juegos')) {
      if (juego[referencia] !== id) continue;
      juego[referencia] = null;
      juego.actualizado_en = ahora();
      transaccion.hSet(claveEntidad('juegos'), String(juego.id), JSON.stringify(juego));
    }
  }

  transaccion.hDel(claveEntidad(entidad), String(id));
  await transaccion.exec();
  return sinContenido();
}

/** Juegos asociados a un estudio o a una plataforma. */
async function juegosRelacionados(db, entidad, id) {
  await obtener(db, entidad, id);
  const campo = entidad === 'estudios' ? 'estudio_id' : 'plataforma_id';
  const juegos = (await todos(db, 'juegos'))
    .filter((j) => j[campo] === id)
    .sort((a, b) => -comparar(a, b, 'anio'));
  const relaciones = await relacionesDeJuegos(db);
  return json({ total: juegos.length, datos: juegos.map((j) => formatear('juegos', j, relaciones)) });
}

export async function estadisticas() {
  const db = await redis();
  const [juegos, nEstudios, nPlataformas, relaciones] = await Promise.all([
    todos(db, 'juegos'),
    db.hLen(claveEntidad('estudios')),
    db.hLen(claveEntidad('plataformas')),
    relacionesDeJuegos(db),
  ]);

  const notas = juegos.map((j) => j.calificacion).filter((n) => n !== null && n !== undefined);
  const anios = juegos.map((j) => j.anio);

  const conteo = new Map();
  for (const j of juegos) conteo.set(j.genero, (conteo.get(j.genero) || 0) + 1);
  const generos = [...conteo]
    .map(([genero, n]) => ({ genero, n }))
    .sort((a, b) => b.n - a.n || a.genero.localeCompare(b.genero, 'es'));

  const destacados = juegos
    .map((j) => normalizar('juegos', j))
    .sort((a, b) => -comparar(a, b, 'calificacion'))
    .slice(0, 3);

  return json({
    juegos: juegos.length,
    estudios: nEstudios,
    plataformas: nPlataformas,
    calificacion_media: notas.length ? Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10 : null,
    rango_anios: { desde: anios.length ? Math.min(...anios) : null, hasta: anios.length ? Math.max(...anios) : null },
    generos,
    destacados: destacados.map((j) => formatear('juegos', j, relaciones)),
  });
}

/* ------------------------------------------------------------------ */
/*  Enrutador de un recurso                                            */
/* ------------------------------------------------------------------ */

const ESCRITURA = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Crea el manejador de la función Netlify de una entidad.
 * Atiende /api/<entidad>, /api/<entidad>/:id y /api/<entidad>/:id/juegos
 */
export function funcionEntidad(entidad) {
  return manejar(async (request) => {
    const url = new URL(request.url);
    const metodo = request.method.toUpperCase();

    // /api/juegos/3/juegos -> ['api', 'juegos', '3', 'juegos']
    const partes = url.pathname.split('/').filter(Boolean);
    const [, , idBruto, subrecurso, sobrante] = partes;

    if (sobrante) throw new RespuestaError(404, `La ruta ${url.pathname} no existe.`);

    // Comprobación del método antes de pedir credenciales.
    const permitidos = !idBruto ? ['GET', 'POST'] : subrecurso ? ['GET'] : ['GET', 'PUT', 'PATCH', 'DELETE'];
    if (!permitidos.includes(metodo)) {
      throw new RespuestaError(405, `El método ${metodo} no está permitido en ${url.pathname}.`, undefined, {
        Allow: permitidos.join(', '),
      });
    }

    // Seguridad: las operaciones que modifican datos exigen un JWT válido
    // (401) y el borrado exige además el rol de administrador (403).
    if (ESCRITURA.has(metodo)) {
      const usuario = autenticar(request);
      if (metodo === 'DELETE') exigirRol(usuario, 'admin');
    }

    const db = await redis();

    /* ---- Colección: /api/<entidad> ---- */
    if (!idBruto) {
      return metodo === 'GET' ? listar(db, entidad, url) : crear(db, entidad, request);
    }

    const id = Number(idBruto);
    if (!Number.isInteger(id) || id < 1) throw new RespuestaError(400, `"${idBruto}" no es un identificador válido.`);

    /* ---- Subrecurso: /api/<entidad>/:id/juegos ---- */
    if (subrecurso) {
      if (subrecurso !== 'juegos' || entidad === 'juegos') {
        throw new RespuestaError(404, `La ruta ${url.pathname} no existe.`);
      }
      return juegosRelacionados(db, entidad, id);
    }

    /* ---- Registro individual ---- */
    switch (metodo) {
      case 'GET':    return respuestaRegistro(db, entidad, await obtener(db, entidad, id));
      case 'PUT':    return actualizar(db, entidad, id, request, { parcial: false });
      case 'PATCH':  return actualizar(db, entidad, id, request, { parcial: true });
      case 'DELETE': return eliminar(db, entidad, id);
    }
  });
}
