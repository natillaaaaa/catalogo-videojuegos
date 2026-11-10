/* =====================================================================
   Frontend de la entidad secundaria: PLATAFORMAS
   ===================================================================== */

const limpiar = (v) => String(v ?? '').trim() || null;

crearAppSecundaria({
  entidad: 'plataformas',
  singular: 'plataforma',
  ordenInicial: 'nombre:asc',

  vacio: {
    nombre: '',
    fabricante: '',
    anio_lanzamiento: '',
    generacion: '',
    unidades_vendidas: '',
    descripcion: '',
    imagen: '',
  },

  validar(d) {
    const fallos = [];
    if (!String(d.nombre).trim()) fallos.push('El nombre es obligatorio.');
    if (!String(d.fabricante).trim()) fallos.push('El fabricante es obligatorio.');
    const anio = Number(d.anio_lanzamiento);
    if (!d.anio_lanzamiento || !Number.isFinite(anio) || anio < 1958 || anio > 2100) {
      fallos.push('El año de lanzamiento debe estar entre 1958 y 2100.');
    }
    if (d.unidades_vendidas !== '' && Number(d.unidades_vendidas) < 0) {
      fallos.push('Las unidades vendidas no pueden ser negativas.');
    }
    return fallos;
  },

  aCuerpo(d) {
    return {
      nombre: String(d.nombre).trim(),
      fabricante: String(d.fabricante).trim(),
      anio_lanzamiento: Number(d.anio_lanzamiento),
      generacion: limpiar(d.generacion),
      unidades_vendidas: d.unidades_vendidas === '' ? null : Number(d.unidades_vendidas),
      descripcion: limpiar(d.descripcion),
      imagen: limpiar(d.imagen),
    };
  },
}).mount('#app');
