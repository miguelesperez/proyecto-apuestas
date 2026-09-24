// ============================================================
// FUNCIONES COMPARTIDAS por todas las páginas
// ============================================================

// ---------- Llamadas HTTP a los microservicios ----------

// Envuelve fetch(): arma la petición, convierte la respuesta a JSON
// y, si el microservicio respondió con error (4xx / 5xx), lanza un
// Error con el mensaje que mandó el backend ({ error: '...' }).
async function pedir(url, metodo = 'GET', cuerpo = null) {
  const opciones = { method: metodo, headers: {} };

  if (cuerpo !== null) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch (e) {
    // fetch solo falla así cuando no hay conexión con el servidor
    throw new Error(`No hay conexión con ${new URL(url).host}. ¿Está corriendo el microservicio?`);
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch (e) {
    datos = null;
  }

  if (!respuesta.ok) {
    const mensaje = datos && datos.error ? datos.error : `Error ${respuesta.status}`;
    throw new Error(mensaje);
  }

  return datos;
}

// ---------- Sesión del usuario ----------
// Guardamos al usuario logueado en sessionStorage (se borra al cerrar
// la pestaña). No guardamos la contraseña: el backend nunca la devuelve.

function guardarSesion(usuario) {
  sessionStorage.setItem('usuario', JSON.stringify({
    id: usuario.id,
    nombre: usuario.nombre,
    usuario: usuario.usuario,
    email: usuario.email
  }));
}

function obtenerSesion() {
  const texto = sessionStorage.getItem('usuario');
  return texto ? JSON.parse(texto) : null;
}

function cerrarSesion() {
  sessionStorage.removeItem('usuario');
  window.location.href = 'index.html';
}

function esAdmin(sesion) {
  return sesion && sesion.usuario === CONFIG.USUARIO_ADMIN;
}

// Protege una página: si no hay sesión, devuelve al login.
function exigirSesion({ soloAdmin = false } = {}) {
  const sesion = obtenerSesion();
  if (!sesion) {
    window.location.href = 'index.html';
    return null;
  }
  if (soloAdmin && !esAdmin(sesion)) {
    window.location.href = 'app.html';
    return null;
  }
  return sesion;
}

// ---------- Formato ----------

function formatoDinero(valor) {
  return '$' + Number(valor).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// MySQL guarda la fecha tal cual la escribió el admin, y el backend
// (que corre en UTC) la devuelve con una "Z" al final. Para mostrar
// exactamente la hora que se escribió, la formateamos en UTC.
function formatoFecha(isoTexto) {
  if (!isoTexto) return '';
  return new Date(isoTexto).toLocaleString('es-CO', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
}

const NOMBRE_RESULTADO = {
  local: 'Gana local',
  empate: 'Empate',
  visitante: 'Gana visitante'
};

// Evita que un nombre de equipo con símbolos < > rompa el HTML
function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------- Mensajes en pantalla ----------

function mostrarMensaje(elemento, texto, tipo = 'ok') {
  elemento.textContent = texto;
  elemento.className = `mensaje mensaje-${tipo}`;
  elemento.hidden = false;
}

function ocultarMensaje(elemento) {
  elemento.hidden = true;
}

// Muestra en el pie de página a qué backend se está conectando
function pintarPieBackend() {
  const pie = document.getElementById('pie-backend');
  if (pie) {
    pie.textContent = `Página servida por ${window.location.host || 'archivo local'} · Backend: ${BACKEND}`;
  }
}
document.addEventListener('DOMContentLoaded', pintarPieBackend);
