const UsuarioModel = require('../models/usuarioModel');

const UsuariosController = {
  async getAll(req, res) {
    try {
      const usuarios = await UsuarioModel.getAll();
      res.json(usuarios);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  },

  async getById(req, res) {
    try {
      const usuario = await UsuarioModel.getById(req.params.id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(usuario);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener el usuario' });
    }
  },

  async create(req, res) {
    try {
      const { nombre, email, usuario, password } = req.body;

      if (!nombre || !email || !usuario || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      const nuevoUsuario = await UsuarioModel.create(req.body);
      res.status(201).json(nuevoUsuario);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear el usuario' });
    }
  },

  async login(req, res) {
    try {
      const { usuario, password } = req.body;

      if (!usuario || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
      }

      const usuarioValidado = await UsuarioModel.validarCredenciales(usuario, password);

      if (!usuarioValidado) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      res.json(usuarioValidado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al validar credenciales' });
    }
  },

  async actualizarSaldo(req, res) {
    try {
      const { monto } = req.body;

      if (typeof monto !== 'number') {
        return res.status(400).json({ error: 'El monto debe ser un número' });
      }

      const usuario = await UsuarioModel.getById(req.params.id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const usuarioActualizado = await UsuarioModel.actualizarSaldo(req.params.id, monto);
      res.json(usuarioActualizado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar el saldo' });
    }
  },

  async update(req, res) {
    try {
      const existe = await UsuarioModel.getById(req.params.id);
      if (!existe) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const actualizado = await UsuarioModel.update(req.params.id, req.body);
      res.json(actualizado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
  },

  async delete(req, res) {
    try {
      const eliminado = await UsuarioModel.delete(req.params.id);
      if (!eliminado) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
  }
};

module.exports = UsuariosController;