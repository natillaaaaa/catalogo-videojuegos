/* =====================================================================
   Fábrica común de los frontends de las entidades secundarias.
   Estudios y plataformas comparten el mismo comportamiento; sólo cambian
   los campos, así que la lógica vive aquí una sola vez.
   ===================================================================== */

/**
 * @param {object} config
 * @param {string} config.entidad     nombre del recurso REST ('estudios')
 * @param {string} config.singular    'estudio'
 * @param {object} config.vacio       formulario en blanco
 * @param {Function} config.validar   (formulario) => string[] con los fallos
 * @param {Function} config.aCuerpo   (formulario) => cuerpo JSON de la petición
 * @param {string} config.ordenInicial p. ej. 'nombre:asc'
 */
function crearAppSecundaria(config) {
  return Vue.createApp({
    data() {
      return {
        f: Formato,
        sesion: Sesion.estado(),   // muestra u oculta crear / editar / borrar
        entidad: config.entidad,

        registros: [],
        conteos: {},          // id -> número de juegos asociados

        cargando: true,
        guardando: false,
        cargandoRelacionados: false,

        filtros: { buscar: '' },
        orden: config.ordenInicial,
        pagina: 1,
        limite: 24,
        total: 0,
        paginas: 1,

        ficha: null,
        relacionados: [],

        formularioAbierto: false,
        editandoId: null,
        formulario: { ...config.vacio },
        errores: [],
        porBorrar: null,
      };
    },

    methods: {
      imagenAlterna,

      /* ---------------- Lectura ---------------- */
      async cargar() {
        this.cargando = true;
        const [ordenar, direccion] = this.orden.split(':');
        try {
          const respuesta = await API.listar(this.entidad, {
            buscar: this.filtros.buscar,
            ordenar,
            direccion,
            pagina: this.pagina,
            limite: this.limite,
          });
          this.registros = respuesta.datos;
          this.total = respuesta.total;
          this.paginas = respuesta.paginas;
          this.contarJuegos();
        } catch (e) {
          avisar(e.message, 'error');
          this.registros = [];
        } finally {
          this.cargando = false;
        }
      },

      /** Cuántos juegos cuelgan de cada registro visible. */
      async contarJuegos() {
        const clave = this.entidad === 'estudios' ? 'estudio_id' : 'plataforma_id';
        await Promise.all(
          this.registros.map(async (r) => {
            try {
              const respuesta = await API.listar('juegos', { [clave]: r.id, limite: 1 });
              this.conteos[r.id] = respuesta.total;
            } catch {
              this.conteos[r.id] = 0;
            }
          })
        );
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
        this.filtros.buscar = '';
        this.recargar();
      },

      async verFicha(registro) {
        this.ficha = registro;
        this.relacionados = [];
        this.cargandoRelacionados = true;
        try {
          const [detalle, juegos] = await Promise.all([
            API.obtener(this.entidad, registro.id),
            API.juegosDe(this.entidad, registro.id),
          ]);
          this.ficha = detalle;
          this.relacionados = juegos.datos;
        } catch (e) {
          avisar(e.message, 'error');
        } finally {
          this.cargandoRelacionados = false;
        }
      },

      cerrarFicha() {
        this.ficha = null;
        this.relacionados = [];
      },

      /* ---------------- Escritura ---------------- */
      abrirCreacion() {
        if (!this.sesion.autenticado) return Sesion.irALogin('requerida');
        this.editandoId = null;
        this.formulario = { ...config.vacio };
        this.errores = [];
        this.formularioAbierto = true;
      },

      abrirEdicion(registro) {
        this.editandoId = registro.id;
        this.formulario = {};
        for (const campo of Object.keys(config.vacio)) {
          this.formulario[campo] = registro[campo] ?? '';
        }
        this.errores = [];
        this.cerrarFicha();
        this.formularioAbierto = true;
      },

      cerrarFormulario() {
        this.formularioAbierto = false;
        this.errores = [];
      },

      async guardar() {
        this.errores = config.validar(this.formulario);
        if (this.errores.length) return;

        this.guardando = true;
        try {
          const cuerpo = config.aCuerpo(this.formulario);
          if (this.editandoId) {
            await API.reemplazar(this.entidad, this.editandoId, cuerpo);
            avisar(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} actualizado.`);
          } else {
            await API.crear(this.entidad, cuerpo);
            avisar(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} creado.`);
          }
          this.formularioAbierto = false;
          await this.cargar();
        } catch (e) {
          this.errores = e.detalles?.length ? e.detalles : [e.message];
        } finally {
          this.guardando = false;
        }
      },

      pedirBorrado(registro) {
        this.porBorrar = registro;
        this.cerrarFicha();
      },

      async confirmarBorrado() {
        this.guardando = true;
        try {
          await API.eliminar(this.entidad, this.porBorrar.id);
          avisar('Registro eliminado.');
          this.porBorrar = null;
          if (this.registros.length === 1 && this.pagina > 1) this.pagina -= 1;
          await this.cargar();
        } catch (e) {
          avisar(e.message, 'error');
        } finally {
          this.guardando = false;
        }
      },
    },

    created() {
      this.buscarConRetardo = retardar(() => this.recargar(), 320);
    },

    async mounted() {
      await this.cargar();

      // Apertura directa de una ficha desde otra página: ?id=3
      const id = parametroUrl('id');
      if (id) {
        const encontrado = this.registros.find((r) => r.id === Number(id));
        if (encontrado) this.verFicha(encontrado);
        else {
          try {
            this.verFicha(await API.obtener(this.entidad, Number(id)));
          } catch {
            avisar('No se encontró el registro solicitado.', 'error');
          }
        }
      }

      window.addEventListener('keydown', (evento) => {
        if (evento.key !== 'Escape') return;
        if (this.porBorrar) this.porBorrar = null;
        else if (this.formularioAbierto) this.cerrarFormulario();
        else if (this.ficha) this.cerrarFicha();
      });
    },
  });
}
