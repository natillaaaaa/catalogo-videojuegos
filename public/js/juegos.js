/* =====================================================================
   Frontend de la entidad principal: JUEGOS
   ===================================================================== */

const FORMULARIO_VACIO = {
  titulo: '',
  anio: '',
  genero: '',
  calificacion: '',
  precio: '',
  descripcion: '',
  imagen: '',
  estudio_id: '',
  plataforma_id: '',
};

Vue.createApp({
  data() {
    return {
      f: Formato,
      sesion: Sesion.estado(),   // muestra u oculta crear / editar / borrar

      juegos: [],
      estudios: [],
      plataformas: [],
      generos: [],

      cargando: true,
      guardando: false,

      filtros: { buscar: '', genero: '', estudio_id: '', plataforma_id: '' },
      orden: 'titulo:asc',
      pagina: 1,
      limite: 24,
      total: 0,
      paginas: 1,

      ficha: null,
      formularioAbierto: false,
      editandoId: null,
      formulario: { ...FORMULARIO_VACIO },
      errores: [],
      porBorrar: null,
    };
  },

  computed: {
    hayFiltros() {
      return Object.values(this.filtros).some((v) => v !== '');
    },
  },

  methods: {
    imagenAlterna,

    /* ---------------- Lectura ---------------- */
    async cargar() {
      this.cargando = true;
      const [ordenar, direccion] = this.orden.split(':');
      try {
        const respuesta = await API.listar('juegos', {
          ...this.filtros,
          ordenar,
          direccion,
          pagina: this.pagina,
          limite: this.limite,
        });
        this.juegos = respuesta.datos;
        this.total = respuesta.total;
        this.paginas = respuesta.paginas;
      } catch (e) {
        avisar(e.message, 'error');
        this.juegos = [];
      } finally {
        this.cargando = false;
      }
    },

    /** Catálogos auxiliares para los selectores y los géneros conocidos. */
    async cargarRelaciones() {
      try {
        const [estudios, plataformas, estadisticas] = await Promise.all([
          API.listar('estudios', { limite: 200 }),
          API.listar('plataformas', { limite: 200 }),
          API.estadisticas(),
        ]);
        this.estudios = estudios.datos;
        this.plataformas = plataformas.datos;
        this.generos = estadisticas.generos.map((g) => g.genero);
      } catch (e) {
        avisar(e.message, 'error');
      }
    },

    recargar() {
      this.pagina = 1;
      this.cargar();
    },

    irA(pagina) {
      this.pagina = pagina;
      this.cargar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    limpiarFiltros() {
      this.filtros = { buscar: '', genero: '', estudio_id: '', plataforma_id: '' };
      this.recargar();
    },

    async verFicha(juego) {
      this.ficha = juego;                                  // respuesta inmediata
      try {
        this.ficha = await API.obtener('juegos', juego.id); // datos frescos
      } catch (e) {
        avisar(e.message, 'error');
      }
    },

    /* ---------------- Escritura ---------------- */
    abrirCreacion() {
      if (!this.sesion.autenticado) return Sesion.irALogin('requerida');
      this.editandoId = null;
      this.formulario = { ...FORMULARIO_VACIO };
      this.errores = [];
      this.formularioAbierto = true;
    },

    abrirEdicion(juego) {
      this.editandoId = juego.id;
      this.formulario = {
        titulo: juego.titulo ?? '',
        anio: juego.anio ?? '',
        genero: juego.genero ?? '',
        calificacion: juego.calificacion ?? '',
        precio: juego.precio ?? '',
        descripcion: juego.descripcion ?? '',
        imagen: juego.imagen ?? '',
        estudio_id: juego.estudio_id ?? '',
        plataforma_id: juego.plataforma_id ?? '',
      };
      this.errores = [];
      this.ficha = null;
      this.formularioAbierto = true;
    },

    cerrarFormulario() {
      this.formularioAbierto = false;
      this.errores = [];
    },

    /** Comprobaciones en el cliente antes de llamar al servicio. */
    validar() {
      const fallos = [];
      const d = this.formulario;
      if (!String(d.titulo).trim()) fallos.push('El título es obligatorio.');
      if (!String(d.genero).trim()) fallos.push('El género es obligatorio.');
      const anio = Number(d.anio);
      if (!d.anio || !Number.isFinite(anio) || anio < 1958 || anio > 2100) {
        fallos.push('El año debe estar entre 1958 y 2100.');
      }
      if (d.calificacion !== '' && (Number(d.calificacion) < 0 || Number(d.calificacion) > 100)) {
        fallos.push('La calificación debe estar entre 0 y 100.');
      }
      if (d.precio !== '' && Number(d.precio) < 0) fallos.push('El precio no puede ser negativo.');
      return fallos;
    },

    /** Convierte los campos vacíos del formulario en nulos para el servicio. */
    cuerpoPeticion() {
      const d = this.formulario;
      return {
        titulo: String(d.titulo).trim(),
        anio: Number(d.anio),
        genero: String(d.genero).trim(),
        calificacion: d.calificacion === '' ? null : Number(d.calificacion),
        precio: d.precio === '' ? null : Number(d.precio),
        descripcion: String(d.descripcion || '').trim() || null,
        imagen: String(d.imagen || '').trim() || null,
        estudio_id: d.estudio_id === '' ? null : Number(d.estudio_id),
        plataforma_id: d.plataforma_id === '' ? null : Number(d.plataforma_id),
      };
    },

    async guardar() {
      this.errores = this.validar();
      if (this.errores.length) return;

      this.guardando = true;
      try {
        const cuerpo = this.cuerpoPeticion();
        if (this.editandoId) {
          await API.reemplazar('juegos', this.editandoId, cuerpo);
          avisar('Juego actualizado.');
        } else {
          await API.crear('juegos', cuerpo);
          avisar('Juego creado.');
        }
        this.formularioAbierto = false;
        await Promise.all([this.cargar(), this.cargarRelaciones()]);
      } catch (e) {
        this.errores = e.detalles?.length ? e.detalles : [e.message];
      } finally {
        this.guardando = false;
      }
    },

    pedirBorrado(juego) {
      this.porBorrar = juego;
      this.ficha = null;
    },

    async confirmarBorrado() {
      this.guardando = true;
      try {
        await API.eliminar('juegos', this.porBorrar.id);
        avisar('Juego eliminado.');
        this.porBorrar = null;
        if (this.juegos.length === 1 && this.pagina > 1) this.pagina -= 1;
        await this.cargar();
      } catch (e) {
        avisar(e.message, 'error');
      } finally {
        this.guardando = false;
      }
    },
  },

  created() {
    // Se aplica el retardo aquí para que cada instancia tenga su temporizador.
    this.buscarConRetardo = retardar(() => this.recargar(), 320);
  },

  async mounted() {
    // Filtros y ficha directa recibidos por la barra de direcciones.
    const estudio = parametroUrl('estudio');
    const plataforma = parametroUrl('plataforma');
    const genero = parametroUrl('genero');
    if (estudio) this.filtros.estudio_id = Number(estudio);
    if (plataforma) this.filtros.plataforma_id = Number(plataforma);
    if (genero) this.filtros.genero = genero;

    await Promise.all([this.cargar(), this.cargarRelaciones()]);

    const id = parametroUrl('id');
    if (id) {
      try {
        this.ficha = await API.obtener('juegos', Number(id));
      } catch {
        avisar('No se encontró el juego solicitado.', 'error');
      }
    }

    // La tecla Escape cierra cualquier capa abierta.
    window.addEventListener('keydown', (evento) => {
      if (evento.key !== 'Escape') return;
      if (this.porBorrar) this.porBorrar = null;
      else if (this.formularioAbierto) this.cerrarFormulario();
      else if (this.ficha) this.ficha = null;
    });
  },
}).mount('#app');
