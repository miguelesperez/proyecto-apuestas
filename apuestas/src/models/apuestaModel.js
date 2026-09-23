require('dotenv').config();
const pool = require('../config/db');

const PARTIDOS_URL = process.env.PARTIDOS_SERVICE_URL || 'http://localhost:3001';
const USUARIOS_URL = process.env.USUARIOS_SERVICE_URL || 'http://localhost:3002';

const ApuestaModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM apuestas ORDER BY fecha DESC');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM apuestas WHERE id = ?', [id]);
    return rows[0];
  },

  async create(datos) {
    const { usuario_id, partido_id, tipo_apuesta, monto } = datos;

    const respuestaPartido = await fetch(`${PARTIDOS_URL}/api/partidos/${partido_id}`);
    if (!respuestaPartido.ok) {
      throw new Error('El partido no existe');
    }
    const partido = await respuestaPartido.json();

    let cuota;
    if (tipo_apuesta === 'local') cuota = partido.cuota_local;
    else if (tipo_apuesta === 'empate') cuota = partido.cuota_empate;
    else cuota = partido.cuota_visitante;

    const respuestaUsuario = await fetch(`${USUARIOS_URL}/api/usuarios/${usuario_id}`);
    if (!respuestaUsuario.ok) {
      throw new Error('El usuario no existe');
    }
    const usuario = await respuestaUsuario.json();

    if (usuario.saldo < monto) {
      throw new Error('Saldo insuficiente');
    }

    const gananciaPotencial = monto * cuota;

    await fetch(`${USUARIOS_URL}/api/usuarios/${usuario_id}/saldo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: -monto })
    });

    const [result] = await pool.query(
      `INSERT INTO apuestas (usuario_id, email, partido_id, tipo_apuesta, monto, cuota_aplicada, ganancia_potencial)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, usuario.email, partido_id, tipo_apuesta, monto, cuota, gananciaPotencial]
    );

    return this.getById(result.insertId);
  },

  async getPendientesPorPartido(partido_id) {
    const [rows] = await pool.query(
      "SELECT * FROM apuestas WHERE partido_id = ? AND estado = 'pendiente'",
      [partido_id]
    );
    return rows;
  },

  async actualizarEstado(id, estado) {
    await pool.query('UPDATE apuestas SET estado = ? WHERE id = ?', [estado, id]);
    return this.getById(id);
  },

  async liquidar(partido_id, resultado) {
    const apuestasPendientes = await this.getPendientesPorPartido(partido_id);
    const resultados = [];

    for (const apuesta of apuestasPendientes) {
      if (apuesta.tipo_apuesta === resultado) {
        await this.actualizarEstado(apuesta.id, 'ganada');

        await fetch(`${USUARIOS_URL}/api/usuarios/${apuesta.usuario_id}/saldo`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: parseFloat(apuesta.ganancia_potencial) })
        });

        resultados.push({ apuesta_id: apuesta.id, resultado: 'ganada' });
      } else {
        await this.actualizarEstado(apuesta.id, 'perdida');
        resultados.push({ apuesta_id: apuesta.id, resultado: 'perdida' });
      }
    }

    return resultados;
  }
};

module.exports = ApuestaModel;