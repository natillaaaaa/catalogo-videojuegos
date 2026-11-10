/* =====================================================================
   Utilidades compartidas por los tres frontends
   ===================================================================== */

const API_BASE = '/api';

/* ---------------------------------------------------------------- */
/*  Indicador de progreso                                            */
/* ---------------------------------------------------------------- */
const Progreso = {
  activas: 0,
  barra: null,
  inicio() {
    if (!this.barra) {
      this.barra = document.createElement('div');
      this.barra.className = 'progreso';
      document.body.appendChild(this.barra);
    }
    this.activas += 1;
    this.barra.classList.remove('hecho');
    requestAnimationFrame(() => this.barra.classList.add('activo'));
  },
  fin() {
    this.activas = Math.max(0, this.activas - 1);
    if (this.activas === 0 && this.barra) {
      this.barra.classList.remove('activo');
      this.barra.classList.add('hecho');
      setTimeout(() => this.barra && this.barra.classList.remove('hecho'), 400);
    }
  },
};

/* ---------------------------------------------------------------- */
/*  Avisos emergentes                                                */
/* ---------------------------------------------------------------- */
function avisar(mensaje, tipo = 'ok') {
  let contenedor = document.querySelector('.avisos');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.className = 'avisos';
    document.body.appendChild(contenedor);
  }

  const aviso = document.createElement('div');
  aviso.className = 'aviso' + (tipo === 'error' ? ' aviso--error' : '');
  aviso.setAttribute('role', 'status');
  aviso.innerHTML = '<span class="aviso__punto"></span><span></span>';
  aviso.lastElementChild.textContent = mensaje;
  contenedor.appendChild(aviso);

  setTimeout(() => {
    aviso.classList.add('saliendo');
    setTimeout(() => aviso.remove(), 320);
  }, 3600);
}

/* ---------------------------------------------------------------- */
/*  Sesión (JWT guardado en el navegador)                            */
/* ---------------------------------------------------------------- */
const Sesion = {
  CLAVE: 'catalogo.sesion',

  /** Guarda el token y los datos públicos del usuario tras el login. */
  guardar({ token, usuario }) {
    localStorage.setItem(this.CLAVE, JSON.stringify({ token, usuario }));
  },

  leer() {
    try {
      return JSON.parse(localStorage.getItem(this.CLAVE)) || null;
    } catch {
      return null;
    }
  },

  /** Lee la carga útil del JWT (sólo para la interfaz; el servidor es quien la valida). */
  cargaUtil(token) {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(base64))));
    } catch {
      return null;
    }
  },

  /** Token vigente o null (si expiró se borra). */
  token() {
    const datos = this.leer();
    if (!datos?.token) return null;
    const carga = this.cargaUtil(datos.token);
    if (!carga || (carga.exp && carga.exp * 1000 <= Date.now())) {
      this.cerrar();
      this.expiro = true;
      return null;
    }
    return datos.token;
  },

  usuario() {
    return this.token() ? this.leer().usuario : null;
  },

  /** Estado reactivo que usan las vistas de Vue para mostrar u ocultar acciones. */
  estado() {
    const usuario = this.usuario();
    return { autenticado: !!usuario, admin: usuario?.rol === 'admin', usuario };
  },

  cerrar() {
    localStorage.removeItem(this.CLAVE);
  },

  /** Envía al inicio de sesión y vuelve después a la página actual. */
  irALogin(motivo) {
    const volver = location.pathname + location.search;
    const q = new URLSearchParams({ volver });
    if (motivo) q.set('motivo', motivo);
    location.href = '/login.html?' + q.toString();
  },
};

/* ---------------------------------------------------------------- */
/*  Cliente de la API REST                                           */
/* ---------------------------------------------------------------- */
class ErrorApi extends Error {
  constructor(mensaje, estado, detalles) {
    super(mensaje);
    this.estado = estado;
    this.detalles = detalles || [];
  }
}

async function peticion(ruta, opciones = {}) {
  Progreso.inicio();
  try {
    // El token se adjunta automáticamente a todas las solicitudes.
    const cabeceras = {};
    if (opciones.cuerpo) cabeceras['Content-Type'] = 'application/json';
    const token = Sesion.token();
    if (token) cabeceras.Authorization = `Bearer ${token}`;

    const respuesta = await fetch(API_BASE + ruta, {
      method: opciones.method || 'GET',
      headers: cabeceras,
      body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
    });

    if (respuesta.status === 204) return null;

    const datos = await respuesta.json().catch(() => null);

    // 401: no hay sesión o el token expiró -> se borra y se va al login.
    // (El login y el registro manejan su propio 401 sin redirigir.)
    if (respuesta.status === 401 && !opciones.sinRedireccion) {
      Sesion.cerrar();
      Sesion.irALogin(token || Sesion.expiro ? 'expirada' : 'requerida');
      throw new ErrorApi(datos?.mensaje || 'Debes iniciar sesión.', 401);
    }

    if (!respuesta.ok) {
      throw new ErrorApi(
        datos?.mensaje || `El servicio respondió con el código ${respuesta.status}.`,
        respuesta.status,
        datos?.detalles
      );
    }
    return datos;
  } catch (e) {
    if (e instanceof ErrorApi) throw e;
    throw new ErrorApi('No se pudo contactar con el servicio. Revisa tu conexión.', 0);
  } finally {
    Progreso.fin();
  }
}

const API = {
  listar: (entidad, params = {}) => {
    const q = new URLSearchParams();
    for (const [clave, valor] of Object.entries(params)) {
      if (valor !== '' && valor !== null && valor !== undefined) q.set(clave, valor);
    }
    const cadena = q.toString();
    return peticion(`/${entidad}${cadena ? '?' + cadena : ''}`);
  },
  obtener:    (entidad, id) => peticion(`/${entidad}/${id}`),
  juegosDe:   (entidad, id) => peticion(`/${entidad}/${id}/juegos`),
  crear:      (entidad, cuerpo) => peticion(`/${entidad}`, { method: 'POST', cuerpo }),
  reemplazar: (entidad, id, cuerpo) => peticion(`/${entidad}/${id}`, { method: 'PUT', cuerpo }),
  modificar:  (entidad, id, cuerpo) => peticion(`/${entidad}/${id}`, { method: 'PATCH', cuerpo }),
  eliminar:   (entidad, id) => peticion(`/${entidad}/${id}`, { method: 'DELETE' }),
  estadisticas: () => peticion('/estadisticas'),

  // Autenticación
  login:    (correo, clave) => peticion('/auth/login', { method: 'POST', cuerpo: { correo, clave }, sinRedireccion: true }),
  registro: (nombre, correo, clave) =>
    peticion('/auth/registro', { method: 'POST', cuerpo: { nombre, correo, clave }, sinRedireccion: true }),
  yo:       () => peticion('/auth/yo'),
};

/* ---------------------------------------------------------------- */
/*  Ayudas de formato                                                */
/* ---------------------------------------------------------------- */
const Formato = {
  precio: (v) => (v === null || v === undefined || v === '' ? '—' : `$${Number(v).toFixed(2)}`),
  numero: (v) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('es-CR')),
  millones: (v) => (!v ? '—' : `${Number(v).toLocaleString('es-CR')} M`),
  fecha: (v) => {
    if (!v) return '—';
    const d = new Date(v.replace(' ', 'T') + 'Z');
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  texto: (v) => (v === null || v === undefined || v === '' ? '—' : v),
};

/** Retrasa la ejecución mientras el usuario sigue escribiendo. */
function retardar(fn, ms = 320) {
  let temporizador;
  return (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => fn(...args), ms);
  };
}

/** Lee un parámetro de la barra de direcciones. */
function parametroUrl(nombre) {
  return new URLSearchParams(location.search).get(nombre);
}

/* ---------------------------------------------------------------- */
/*  Cabecera: menú móvil y marcado de la sección activa              */
/* ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const boton = document.querySelector('.menu-boton');
  const nav = document.querySelector('.nav');
  if (boton && nav) {
    boton.addEventListener('click', () => nav.classList.toggle('abierto'));
  }

  pintarSesionEnCabecera(nav);
  vigilarExpiracion();

  const actual = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach((enlace) => {
    if (enlace.getAttribute('href') === actual) enlace.classList.add('activo');
  });
});

/** Cuando el token vence con la página abierta, avisa y lleva al login. */
function vigilarExpiracion() {
  const token = Sesion.token();
  if (!token) return;
  const { exp } = Sesion.cargaUtil(token) || {};
  if (!exp) return;
  const restante = exp * 1000 - Date.now();
  if (restante > 2 ** 31 - 1) return; // fuera del rango de setTimeout
  setTimeout(() => {
    Sesion.cerrar();
    avisar('Tu sesión expiró. Inicia sesión de nuevo.', 'error');
    setTimeout(() => Sesion.irALogin('expirada'), 1200);
  }, Math.max(restante, 0));
}

/** Muestra "Iniciar sesión / Registrarse" o el usuario con la opción de salir. */
function pintarSesionEnCabecera(nav) {
  if (!nav) return;
  const caja = document.createElement('div');
  caja.className = 'nav__sesion';
  const usuario = Sesion.usuario();

  if (usuario) {
    caja.innerHTML = '<span class="nav__usuario"><b></b><small></small></span><a href="#" class="nav__salir">Salir</a>';
    caja.querySelector('b').textContent = usuario.nombre;
    caja.querySelector('small').textContent = usuario.rol;
    caja.querySelector('.nav__salir').addEventListener('click', (e) => {
      e.preventDefault();
      Sesion.cerrar();           // logout: elimina el token
      avisar('Sesión cerrada.');
      setTimeout(() => location.reload(), 500);
    });
  } else {
    caja.innerHTML = '<a href="login.html">Iniciar sesión</a><a href="registro.html" class="nav__registro">Registrarse</a>';
  }
  nav.appendChild(caja);
}

/** Sustituye una imagen rota por un panel con la inicial del título. */
function imagenAlterna(evento, titulo = '?') {
  const img = evento.target;
  if (img.dataset.alterna) return;
  img.dataset.alterna = '1';
  const inicial = String(titulo).trim().charAt(0).toUpperCase() || '?';
  img.src =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">
         <rect width="300" height="400" fill="#0a0d0a"/>
         <text x="150" y="230" text-anchor="middle" font-family="sans-serif"
               font-size="150" font-weight="800" fill="#76b900" opacity="0.5">${inicial}</text>
       </svg>`
    );
}
