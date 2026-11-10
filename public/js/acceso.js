/* =====================================================================
   Utilidades de las pantallas de inicio de sesión y registro
   ===================================================================== */

/**
 * Página a la que se vuelve tras entrar. Sólo se aceptan rutas del
 * propio sitio para evitar redirecciones a dominios externos.
 */
function destinoTrasAcceso() {
  const volver = parametroUrl('volver');
  if (volver && volver.startsWith('/') && !volver.startsWith('//') && !/\/(login|registro)\.html/.test(volver)) {
    return volver;
  }
  return '/juegos.html';
}
