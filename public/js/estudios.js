/* =====================================================================
   Frontend de la entidad secundaria: ESTUDIOS
   ===================================================================== */

const limpiarTexto = (v) => String(v ?? '').trim() || null;

crearAppSecundaria({
  entidad: 'estudios',
  singular: 'estudio',
  ordenInicial: 'nombre:asc',

  vacio: {
    nombre: '',
    pais: '',
    anio_fundacion: '',
    fundador: '',
    sitio_web: '',
    descripcion: '',
    imagen: '',
  },

  validar(d) {
    const fallos = [];
    if (!String(d.nombre).trim()) fallos.push('El nombre es obligatorio.');
    if (!String(d.pais).trim()) fallos.push('El país es obligatorio.');
    const anio = Number(d.anio_fundacion);
    if (!d.anio_fundacion || !Number.isFinite(anio) || anio < 1900 || anio > 2100) {
      fallos.push('El año de fundación debe estar entre 1900 y 2100.');
    }
    if (d.sitio_web && !/^https?:\/\//i.test(String(d.sitio_web).trim())) {
      fallos.push('El sitio web debe empezar por http:// o https://');
    }
    return fallos;
  },

  aCuerpo(d) {
    return {
      nombre: String(d.nombre).trim(),
      pais: String(d.pais).trim(),
      anio_fundacion: Number(d.anio_fundacion),
      fundador: limpiarTexto(d.fundador),
      sitio_web: limpiarTexto(d.sitio_web),
      descripcion: limpiarTexto(d.descripcion),
      imagen: limpiarTexto(d.imagen),
    };
  },
}).mount('#app');
