// ============================================================
// Middleware: solo deja pasar si quien llama es ADMINISTRADOR.
// PARTIDOS no sabe quién es admin: se lo PREGUNTA al microservicio
// USUARIOS (comunicación síncrona HTTP), enviándole el token.
// ============================================================

const USUARIOS_SERVICE_URL = process.env.USUARIOS_SERVICE_URL || 'http://localhost:3002';

async function verificarAdmin(req, res, next) {
  const encabezado = req.headers.authorization;

  // 1. Sin token no hay nada que verificar
  if (!encabezado) {
    return res.status(401).json({ error: 'Se requiere iniciar sesión como administrador' });
  }

  // 2. Le preguntamos a USUARIOS si el token es válido y qué rol tiene
  let respuesta;
  try {
    respuesta = await fetch(`${USUARIOS_SERVICE_URL}/api/usuarios/verificar`, {
      headers: { Authorization: encabezado }
    });
  } catch (error) {
    // USUARIOS está apagado: no podemos confirmar el rol, así que NO dejamos pasar
    return res.status(503).json({ error: 'No se pudo verificar el rol: el servicio USUARIOS no responde' });
  }

  if (!respuesta.ok) {
    return res.status(401).json({ error: 'Token inválido o vencido. Inicie sesión de nuevo' });
  }

  const datos = await respuesta.json();

  // 3. El token es válido, pero ¿es de un administrador?
  if (datos.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo el administrador puede realizar esta acción' });
  }

  // 4. Todo bien: seguimos al controlador
  next();
}

module.exports = verificarAdmin;
