// ============================================================
// index.html — Ingreso y registro (habla con USUARIOS :3002)
// ============================================================

const mensaje = document.getElementById('mensaje');

// Si ya había sesión abierta, entra directo
const sesionActual = obtenerSesion();
if (sesionActual) {
  window.location.href = esAdmin(sesionActual) ? 'admin.html' : 'app.html';
}

// ---------- Pestañas Ingresar / Crear cuenta ----------
document.querySelectorAll('.pestana').forEach((boton) => {
  boton.addEventListener('click', () => {
    document.querySelectorAll('.pestana').forEach((b) => b.classList.remove('activa'));
    document.querySelectorAll('.panel').forEach((p) => (p.hidden = true));
    boton.classList.add('activa');
    document.getElementById(boton.dataset.panel).hidden = false;
    ocultarMensaje(mensaje);
  });
});

// ---------- Ingresar ----------
document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarMensaje(mensaje);

  const usuario = document.getElementById('login-usuario').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    // El backend compara la contraseña con el hash de bcrypt y,
    // si coincide, devuelve el usuario (sin el campo password).
    const datos = await pedir(`${API.USUARIOS}/login`, 'POST', { usuario, password });
    guardarSesion(datos);
    window.location.href = esAdmin(datos) ? 'admin.html' : 'app.html';
  } catch (error) {
    mostrarMensaje(mensaje, error.message, 'error');
  }
});

// ---------- Crear cuenta ----------
document.getElementById('form-registro').addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarMensaje(mensaje);

  const nuevo = {
    nombre: document.getElementById('reg-nombre').value.trim(),
    email: document.getElementById('reg-email').value.trim(),
    usuario: document.getElementById('reg-usuario').value.trim(),
    password: document.getElementById('reg-password').value
  };

  try {
    await pedir(API.USUARIOS, 'POST', nuevo);

    // Entramos de una vez con la cuenta nueva
    const datos = await pedir(`${API.USUARIOS}/login`, 'POST', {
      usuario: nuevo.usuario,
      password: nuevo.password
    });
    guardarSesion(datos);
    window.location.href = esAdmin(datos) ? 'admin.html' : 'app.html';
  } catch (error) {
    // email y usuario son UNIQUE en MySQL: si ya existen, el backend responde 500
    const texto = error.message === 'Error al crear el usuario'
      ? 'No se pudo crear la cuenta. Es posible que ese usuario o email ya estén registrados.'
      : error.message;
    mostrarMensaje(mensaje, texto, 'error');
  }
});
