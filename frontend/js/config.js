// ============================================================
// CONFIGURACIÓN: dónde están los microservicios (servidorUbuntu2)
// ============================================================
// Este es el ÚNICO archivo que hay que tocar si cambian las IPs
// o el nombre de dominio.

const CONFIG = {
  // IP fija de servidorUbuntu2 en la red privada de Vagrant
  BACKEND_IP: '192.168.100.3',

  // Nombre DNS de servidorUbuntu2 (registro tipo A en el BIND del Taller 4).
  // CAMBIAR 'hitblack.com' por el dominio de ustedes.
  BACKEND_NOMBRE: 'servidor2.hitblack.com',

  // Puertos de cada microservicio
  PUERTO_PARTIDOS: 3001,
  PUERTO_USUARIOS: 3002,
  PUERTO_APUESTAS: 3003,

  // Usuario que entra al panel de administración
  USUARIO_ADMIN: 'admin'
};

// ------------------------------------------------------------
// ¿A qué host del backend le hablamos?
// La decisión depende de CÓMO se abrió esta página:
//   - Por IP      (http://192.168.100.2)      -> backend por IP
//   - Por dominio (http://www.hitblack.com)  -> backend por nombre DNS
//   - En local    (localhost o doble clic)    -> backend en localhost
// Así se demuestra que el sistema funciona tanto por IP como por dominio.
// ------------------------------------------------------------
function elegirBackend() {
  const host = window.location.hostname;
  const esIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);

  if (host === '' || host === 'localhost' || host === '127.0.0.1') return 'localhost';
  if (esIP) return CONFIG.BACKEND_IP;
  return CONFIG.BACKEND_NOMBRE;
}

const BACKEND = elegirBackend();

const API = {
  PARTIDOS: `http://${BACKEND}:${CONFIG.PUERTO_PARTIDOS}/api/partidos`,
  USUARIOS: `http://${BACKEND}:${CONFIG.PUERTO_USUARIOS}/api/usuarios`,
  APUESTAS: `http://${BACKEND}:${CONFIG.PUERTO_APUESTAS}/api/apuestas`
};
