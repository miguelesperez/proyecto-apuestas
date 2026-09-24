// ============================================================
// app.html — Vista del apostador
// Habla con los 3 microservicios:
//   PARTIDOS :3001  -> lista de partidos
//   APUESTAS :3003  -> crear apuesta y ver mis apuestas
//   USUARIOS :3002  -> saldo y recarga
// ============================================================

const sesion = exigirSesion();
const mensaje = document.getElementById('mensaje');

// Guardamos los partidos en memoria para mostrar nombres de equipos
// en "Mis apuestas" (APUESTAS solo guarda el partido_id).
let partidos = [];
let seleccion = null; // { partido, tipo, cuota } de la apuesta en curso

if (sesion) {
  document.getElementById('nombre-usuario').textContent = sesion.nombre;
  document.getElementById('btn-salir').addEventListener('click', cerrarSesion);
  iniciar();
}

async function iniciar() {
  await Promise.all([cargarSaldo(), cargarPartidos()]);
  await cargarMisApuestas();
}

// ---------- Pestañas ----------
document.querySelectorAll('.pestana').forEach((boton) => {
  boton.addEventListener('click', () => {
    document.querySelectorAll('.pestana').forEach((b) => b.classList.remove('activa'));
    document.querySelectorAll('.panel').forEach((p) => (p.hidden = true));
    boton.classList.add('activa');
    document.getElementById(boton.dataset.panel).hidden = false;
    ocultarMensaje(mensaje);

    if (boton.dataset.panel === 'panel-apuestas') cargarMisApuestas();
    if (boton.dataset.panel === 'panel-partidos') cargarPartidos();
  });
});

// ---------- Saldo (USUARIOS) ----------
async function cargarSaldo() {
  try {
    const usuario = await pedir(`${API.USUARIOS}/${sesion.id}`);
    document.getElementById('saldo').textContent = formatoDinero(usuario.saldo);
    return Number(usuario.saldo);
  } catch (error) {
    mostrarMensaje(mensaje, error.message, 'error');
    return null;
  }
}

// ---------- Partidos (PARTIDOS) ----------
async function cargarPartidos() {
  const contenedor = document.getElementById('lista-partidos');
  try {
    partidos = await pedir(API.PARTIDOS);
  } catch (error) {
    mostrarMensaje(mensaje, error.message, 'error');
    return;
  }

  // Solo se puede apostar a partidos que aún no se han jugado
  const disponibles = partidos.filter((p) => p.estado === 'programado');

  if (disponibles.length === 0) {
    contenedor.innerHTML = '<p class="vacio">No hay partidos disponibles por ahora.</p>';
    return;
  }

  contenedor.innerHTML = disponibles.map((p) => `
    <article class="tarjeta partido">
      <div class="partido-fecha">${formatoFecha(p.fecha)}</div>
      <div class="partido-equipos">
        ${escapar(p.equipo_local)}<span class="vs">vs</span>${escapar(p.equipo_visitante)}
      </div>
      <div class="cuotas">
        <button class="cuota" data-id="${p.id}" data-tipo="local">
          <small>Local</small><strong>${Number(p.cuota_local).toFixed(2)}</strong>
        </button>
        <button class="cuota" data-id="${p.id}" data-tipo="empate">
          <small>Empate</small><strong>${Number(p.cuota_empate).toFixed(2)}</strong>
        </button>
        <button class="cuota" data-id="${p.id}" data-tipo="visitante">
          <small>Visitante</small><strong>${Number(p.cuota_visitante).toFixed(2)}</strong>
        </button>
      </div>
    </article>
  `).join('');

  contenedor.querySelectorAll('.cuota').forEach((boton) => {
    boton.addEventListener('click', () => abrirApuesta(Number(boton.dataset.id), boton.dataset.tipo));
  });
}

// ---------- Ventana de apuesta ----------
const dialogo = document.getElementById('dialogo-apuesta');
const inputMonto = document.getElementById('ap-monto');
const mensajeApuesta = document.getElementById('mensaje-apuesta');

function abrirApuesta(partidoId, tipo) {
  const partido = partidos.find((p) => p.id === partidoId);
  const cuota = Number(partido[`cuota_${tipo}`]);
  seleccion = { partido, tipo, cuota };

  document.getElementById('ap-partido').textContent = `${partido.equipo_local} vs ${partido.equipo_visitante}`;
  document.getElementById('ap-tipo').textContent = NOMBRE_RESULTADO[tipo];
  document.getElementById('ap-cuota').textContent = cuota.toFixed(2);
  inputMonto.value = '';
  actualizarGanancia();
  ocultarMensaje(mensajeApuesta);
  dialogo.showModal();
  inputMonto.focus();
}

function actualizarGanancia() {
  const monto = Number(inputMonto.value) || 0;
  document.getElementById('ap-ganancia').textContent = formatoDinero(monto * (seleccion ? seleccion.cuota : 0));
}

inputMonto.addEventListener('input', actualizarGanancia);
document.getElementById('btn-cancelar').addEventListener('click', () => dialogo.close());

// Crear apuesta: POST /api/apuestas
// APUESTAS se encarga de todo lo demás: consulta el partido en PARTIDOS,
// valida y descuenta el saldo en USUARIOS, y guarda la apuesta.
document.getElementById('form-apuesta').addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarMensaje(mensajeApuesta);

  const monto = Number(inputMonto.value);
  const botonApostar = document.getElementById('btn-apostar');
  botonApostar.disabled = true;

  try {
    await pedir(API.APUESTAS, 'POST', {
      usuario_id: sesion.id,
      partido_id: seleccion.partido.id,
      tipo_apuesta: seleccion.tipo,
      monto
    });
    dialogo.close();
    mostrarMensaje(mensaje, `Apuesta registrada: ${formatoDinero(monto)} a "${NOMBRE_RESULTADO[seleccion.tipo]}".`, 'ok');
    await cargarSaldo();
    await cargarMisApuestas();
  } catch (error) {
    mostrarMensaje(mensajeApuesta, error.message, 'error');
  } finally {
    botonApostar.disabled = false;
  }
});

// ---------- Mis apuestas (APUESTAS) ----------
async function cargarMisApuestas() {
  const cuerpo = document.getElementById('tabla-apuestas');
  let apuestas;
  try {
    apuestas = await pedir(API.APUESTAS);
  } catch (error) {
    mostrarMensaje(mensaje, error.message, 'error');
    return;
  }

  // El microservicio devuelve todas las apuestas; nos quedamos con las del usuario
  const mias = apuestas.filter((a) => a.usuario_id === sesion.id);

  if (mias.length === 0) {
    cuerpo.innerHTML = '<tr><td colspan="6" class="vacio">Aún no tienes apuestas.</td></tr>';
    return;
  }

  cuerpo.innerHTML = mias.map((a) => {
    const partido = partidos.find((p) => p.id === a.partido_id);
    const nombrePartido = partido
      ? `${escapar(partido.equipo_local)} vs ${escapar(partido.equipo_visitante)}`
      : `Partido #${a.partido_id}`;
    return `
      <tr>
        <td>${nombrePartido}</td>
        <td>${NOMBRE_RESULTADO[a.tipo_apuesta]}</td>
        <td class="num">${formatoDinero(a.monto)}</td>
        <td class="num">${Number(a.cuota_aplicada).toFixed(2)}</td>
        <td class="num">${formatoDinero(a.ganancia_potencial)}</td>
        <td><span class="etiqueta etiqueta-${a.estado}">${a.estado}</span></td>
      </tr>`;
  }).join('');
}

// ---------- Recargar saldo (USUARIOS) ----------
document.getElementById('form-recarga').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('monto-recarga');
  const monto = Number(input.value);

  try {
    // Monto positivo = acreditar (el backend hace saldo = saldo + monto)
    await pedir(`${API.USUARIOS}/${sesion.id}/saldo`, 'PUT', { monto });
    input.value = '';
    await cargarSaldo();
    mostrarMensaje(mensaje, `Se recargaron ${formatoDinero(monto)}.`, 'ok');
  } catch (error) {
    mostrarMensaje(mensaje, error.message, 'error');
  }
});
