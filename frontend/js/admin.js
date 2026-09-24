// ============================================================
// admin.html — Panel de administración
//   PARTIDOS :3001  -> crear, finalizar (dispara la liquidación), eliminar
//   APUESTAS :3003  -> ver todas las apuestas
//   USUARIOS :3002  -> ver usuarios y recargarles saldo
// ============================================================

const sesion = exigirSesion({ soloAdmin: true });
const mensaje = document.getElementById('mensaje');
let partidos = [];
let usuarios = [];

if (sesion) {
  document.getElementById('nombre-usuario').textContent = sesion.nombre;
  document.getElementById('btn-salir').addEventListener('click', cerrarSesion);
  cargarPartidos();
}

// ---------- Pestañas ----------
document.querySelectorAll('.pestana').forEach((boton) => {
  boton.addEventListener('click', () => {
    document.querySelectorAll('.pestana').forEach((b) => b.classList.remove('activa'));
    document.querySelectorAll('.panel').forEach((p) => (p.hidden = true));
    boton.classList.add('activa');
    document.getElementById(boton.dataset.panel).hidden = false;
    ocultarMensaje(mensaje);

    if (boton.dataset.panel === 'panel-partidos') cargarPartidos();
    if (boton.dataset.panel === 'panel-apuestas') cargarApuestas();
    if (boton.dataset.panel === 'panel-usuarios') cargarUsuarios();
  });
});

// ============================================================
// PARTIDOS
// ============================================================
async function cargarPartidos() {
  const cuerpo = document.getElementById('tabla-partidos');
  try {
    partidos = await pedir(API.PARTIDOS);
  } catch (error) {
    mostrarMensaje(mensaje, error.message, 'error');
    return;
  }

  if (partidos.length === 0) {
    cuerpo.innerHTML = '<tr><td colspan="6" class="vacio">No hay partidos creados.</td></tr>';
    return;
  }

  cuerpo.innerHTML = partidos.map((p) => {
    const cuotas = [p.cuota_local, p.cuota_empate, p.cuota_visitante].map((c) => Number(c).toFixed(2)).join(' / ');
    const estado = p.estado === 'finalizado'
      ? `<span class="etiqueta etiqueta-finalizado">finalizado · ${NOMBRE_RESULTADO[p.resultado]}</span>`
      : `<span class="etiqueta etiqueta-${p.estado}">${p.estado}</span>`;

    const acciones = p.estado === 'finalizado'
      ? `<button class="boton boton-peligro boton-pequeno" data-eliminar="${p.id}">Eliminar</button>`
      : `<div class="finalizar">
           <select data-resultado="${p.id}">
             <option value="local">Gana local</option>
             <option value="empate">Empate</option>
             <option value="visitante">Gana visitante</option>
           </select>
           <button class="boton boton-pequeno" data-finalizar="${p.id}">Finalizar</button>
           <button class="boton boton-peligro boton-pequeno" data-eliminar="${p.id}">Eliminar</button>
         </div>`;

    return `
      <tr>
        <td>${p.id}</td>
        <td>${escapar(p.equipo_local)} vs ${escapar(p.equipo_visitante)}</td>
        <td>${formatoFecha(p.fecha)}</td>
        <td class="num">${cuotas}</td>
        <td>${estado}</td>
        <td>${acciones}</td>
      </tr>`;
  }).join('');

  cuerpo.querySelectorAll('[data-finalizar]').forEach((b) =>
    b.addEventListener('click', () => finalizarPartido(Number(b.dataset.finalizar))));
  cuerpo.querySelectorAll('[data-eliminar]').forEach((b) =>
    b.addEventListener('click', () => eliminarPartido(Number(b.dataset.eliminar))));
}

// Crear partido: POST /api/partidos
document.getElementById('form-partido').addEventListener('submit', async (e) => {
  e.preventDefault();

  // El input datetime-local da "2026-10-15T20:00"; MySQL espera "2026-10-15 20:00:00"
  const fecha = document.getElementById('p-fecha').value.replace('T', ' ') + ':00';

  const nuevo = {
    equipo_local: document.getElementById('p-local').value.trim(),
    equipo_visitante: document.getElementById('p-visitante').value.trim(),
    fecha,
    cuota_local: Number(document.getElementById('p-cuota-local').value),
    cuota_empate: Number(document.getElementById('p-cuota-empate').value),
    cuota_visitante: Number(document.getElementById('p-cuota-visitante').value)
  };

  try {
    const creado = await pedir(API.PARTIDOS, 'POST', nuevo);
    e.target.reset();
    mostrarMensaje(mensaje, `Partido #${creado.id} creado: ${creado.equipo_local} vs ${creado.equipo_visitante}.`, 'ok');
    cargarPartidos();
  } catch (error) {
    mostrarMensaje(mensaje, error.message, 'error');
  }
});

// Finalizar partido: PUT /api/partidos/:id/finalizar
// PARTIDOS guarda el resultado y llama por su cuenta a APUESTAS para
// liquidar; APUESTAS a su vez acredita en USUARIOS a los ganadores.
async function finalizarPartido(id) {
  const resultado = document.querySelector(`[data-resultado="${id}"]`).value;
  const partido = partidos.find((p) => p.id === id);
  const confirmar = window.confirm(
    `¿Finalizar ${partido.equipo_local} vs ${partido.equipo_visitante} con resultado "${NOMBRE_RESULTADO[resultado]}"?\n` +
    'Esto liquida todas sus apuestas pendientes y no se puede deshacer.'
  );
  if (!confirmar) return;

  try {
    const respuesta = await pedir(`${API.PARTIDOS}/${id}/finalizar`, 'PUT', { resultado });
    const liq = respuesta.liquidacion;

    if (liq.ok) {
      const lista = liq.detalle.resultados;
      const ganadas = lista.filter((r) => r.resultado === 'ganada').length;
      const perdidas = lista.length - ganadas;
      mostrarMensaje(mensaje,
        `Partido finalizado. Apuestas liquidadas: ${lista.length} (${ganadas} ganadas, ${perdidas} perdidas).`, 'ok');
    } else {
      // El partido quedó finalizado, pero APUESTAS no respondió (try/catch interno del backend)
      mostrarMensaje(mensaje,
        `El partido quedó finalizado, pero la liquidación falló: ${liq.detalle}`, 'error');
    }
    cargarPartidos();
  } catch (error) {
    mostrarMensaje(mensaje, error.message, 'error');
  }
}

// Eliminar partido: DELETE /api/partidos/:id
async function eliminarPartido(id) {
  const partido = partidos.find((p) => p.id === id);
  if (!window.confirm(`¿Eliminar el partido ${partido.equipo_local} vs ${partido.equipo_visitante}?`)) return;

  try {
    await pedir(`${API.PARTIDOS}/${id}`, 'DELETE');
    mostrarMensaje(mensaje, 'Partido eliminado.', 'ok');
    cargarPartidos();
  } catch (error) {
    mostrarMensaje(mensaje, error.message, 'error');
  }
}

// ============================================================
// APUESTAS
// ============================================================
async function cargarApuestas() {
  const cuerpo = document.getElementById('tabla-apuestas');
  let apuestas;
  try {
    [apuestas, partidos] = await Promise.all([pedir(API.APUESTAS), pedir(API.PARTIDOS)]);
  } catch (error) {
    mostrarMensaje(mensaje, error.message, 'error');
    return;
  }

  if (apuestas.length === 0) {
    cuerpo.innerHTML = '<tr><td colspan="8" class="vacio">Todavía no hay apuestas.</td></tr>';
    return;
  }

  cuerpo.innerHTML = apuestas.map((a) => {
    const partido = partidos.find((p) => p.id === a.partido_id);
    const nombrePartido = partido
      ? `${escapar(partido.equipo_local)} vs ${escapar(partido.equipo_visitante)}`
      : `Partido #${a.partido_id}`;
    return `
      <tr>
        <td>${a.id}</td>
        <td>${escapar(a.email)}</td>
        <td>${nombrePartido}</td>
        <td>${NOMBRE_RESULTADO[a.tipo_apuesta]}</td>
        <td class="num">${formatoDinero(a.monto)}</td>
        <td class="num">${Number(a.cuota_aplicada).toFixed(2)}</td>
        <td class="num">${formatoDinero(a.ganancia_potencial)}</td>
        <td><span class="etiqueta etiqueta-${a.estado}">${a.estado}</span></td>
      </tr>`;
  }).join('');
}

// ============================================================
// USUARIOS
// ============================================================
async function cargarUsuarios() {
  const cuerpo = document.getElementById('tabla-usuarios');
  try {
    usuarios = await pedir(API.USUARIOS);
  } catch (error) {
    mostrarMensaje(mensaje, error.message, 'error');
    return;
  }

  cuerpo.innerHTML = usuarios.map((u) => `
    <tr>
      <td>${u.id}</td>
      <td>${escapar(u.nombre)}</td>
      <td>${escapar(u.usuario)}</td>
      <td>${escapar(u.email)}</td>
      <td class="num">${formatoDinero(u.saldo)}</td>
      <td>
        <div class="finalizar">
          <select data-recarga="${u.id}">
            <option value="50">$50</option>
            <option value="100" selected>$100</option>
            <option value="500">$500</option>
          </select>
          <button class="boton boton-pequeno" data-recargar="${u.id}">Recargar</button>
        </div>
      </td>
    </tr>`).join('');

  cuerpo.querySelectorAll('[data-recargar]').forEach((b) =>
    b.addEventListener('click', () => recargar(Number(b.dataset.recargar))));
}

// Recargar: PUT /api/usuarios/:id/saldo con monto positivo
async function recargar(id) {
  const monto = Number(document.querySelector(`[data-recarga="${id}"]`).value);
  try {
    const actualizado = await pedir(`${API.USUARIOS}/${id}/saldo`, 'PUT', { monto });
    mostrarMensaje(mensaje, `Saldo de ${actualizado.usuario}: ${formatoDinero(actualizado.saldo)}.`, 'ok');
    cargarUsuarios();
  } catch (error) {
    mostrarMensaje(mensaje, error.message, 'error');
  }
}
