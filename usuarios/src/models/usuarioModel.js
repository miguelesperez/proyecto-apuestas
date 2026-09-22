const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const UsuarioModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT id, nombre, email, usuario, saldo FROM usuarios');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT id, nombre, email, usuario, saldo FROM usuarios WHERE id = ?', [id]);
    return rows[0];
  },

  async create(datos) {
    const { nombre, email, usuario, password } = datos;
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, usuario, password) VALUES (?, ?, ?, ?)',
      [nombre, email, usuario, passwordHash]
    );

    return this.getById(result.insertId);
  },

  async validarCredenciales(usuario, password) {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
    const usuarioEncontrado = rows[0];

    if (!usuarioEncontrado) {
      return null;
    }

    const passwordCorrecta = await bcrypt.compare(password, usuarioEncontrado.password);

    if (!passwordCorrecta) {
      return null;
    }

    delete usuarioEncontrado.password;
    return usuarioEncontrado;
  },

  async actualizarSaldo(id, monto) {
    await pool.query('UPDATE usuarios SET saldo = saldo + ? WHERE id = ?', [monto, id]);
    return this.getById(id);
  },

  async update(id, datos) {
    const { nombre, email, usuario } = datos;
    await pool.query(
      'UPDATE usuarios SET nombre = ?, email = ?, usuario = ? WHERE id = ?',
      [nombre, email, usuario, id]
    );
    return this.getById(id);
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = UsuarioModel;