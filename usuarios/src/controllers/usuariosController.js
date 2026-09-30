const jwt = require('jsonwebtoken');
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

      // Nadie puede registrarse con el nombre del administrador:
      // esa cuenta solo existe en el backend (archivo .env)
      if (usuario === process.env.ADMIN_USUARIO) {
        return res.status(400).json({ error: 'Ese nombre de usuario no está disponible' });
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

      // 1. ¿Es el administrador? Sus credenciales están definidas en el
      //    backend (.env), NO en la base de datos ni en el frontend.
      if (usuario === process.env.ADMIN_USUARIO && password === process.env.ADMIN_PASSWORD) {
        // Se le entrega un TOKEN firmado con la clave secreta de USUARIOS.
        // Con ese token el admin demuestra su rol ante los otros servicios.
        const token = jwt.sign({ usuario, rol: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });

        return res.json({
          id: 0,
          nombre: 'Administrador',
          usuario,
          email: null,
          rol: 'admin',
          token
        });
      }

      // 2. Si no, es un apostador: se valida contra la base de datos
      const usuarioValidado = await UsuarioModel.validarCredenciales(usuario, password);

      if (!usuarioValidado) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // El backend decide el rol; el frontend solo lo lee
      res.json({ ...usuarioValidado, rol: 'apostador' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al validar credenciales' });
    }
  },

  // GET /api/usuarios/verificar  (header Authorization: Bearer <token>)
  // Lo usan OTROS microservicios (PARTIDOS) para preguntar:
  // "¿este token es válido y qué rol tiene?"
  async verificar(req, res) {
    const encabezado = req.headers.authorization || '';
    const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'No se envió token' });
    }

    try {
      // Solo USUARIOS conoce JWT_SECRET, por eso solo él puede validar el token
      const datos = jwt.verify(token, process.env.JWT_SECRET);
      res.json({ valido: true, usuario: datos.usuario, rol: datos.rol });
    } catch (error) {
      res.status(401).json({ error: 'Token inválido o vencido' });
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