const pool = require('../config/db');

const PartidoModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM partidos ORDER BY fecha DESC');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM partidos WHERE id = ?', [id]);
    return rows[0];
  },

  async create(datos) {
    const { equipo_local, equipo_visitante, fecha, cuota_local, cuota_empate, cuota_visitante } = datos;
    const [result] = await pool.query(
      `INSERT INTO partidos (equipo_local, equipo_visitante, fecha, cuota_local, cuota_empate, cuota_visitante)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [equipo_local, equipo_visitante, fecha, cuota_local, cuota_empate, cuota_visitante]
    );
    return this.getById(result.insertId);
  },

  async update(id, datos) {
    const { equipo_local, equipo_visitante, fecha, cuota_local, cuota_empate, cuota_visitante, estado } = datos;
    await pool.query(
      `UPDATE partidos SET
        equipo_local = ?, equipo_visitante = ?, fecha = ?,
        cuota_local = ?, cuota_empate = ?, cuota_visitante = ?, estado = ?
       WHERE id = ?`,
      [equipo_local, equipo_visitante, fecha, cuota_local, cuota_empate, cuota_visitante, estado, id]
    );
    return this.getById(id);
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM partidos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async finalizar(id, resultado) {
    await pool.query(
      `UPDATE partidos SET estado = 'finalizado', resultado = ? WHERE id = ?`,
      [resultado, id]
    );
    return this.getById(id);
  }
};

module.exports = PartidoModel;