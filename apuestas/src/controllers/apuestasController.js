const ApuestaModel = require('../models/apuestaModel');

const ApuestasController = {
  async getAll(req, res) {
    try {
      const apuestas = await ApuestaModel.getAll();
      res.json(apuestas);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener apuestas' });
    }
  },

  async getById(req, res) {
    try {
      const apuesta = await ApuestaModel.getById(req.params.id);
      if (!apuesta) {
        return res.status(404).json({ error: 'Apuesta no encontrada' });
      }
      res.json(apuesta);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener la apuesta' });
    }
  },

  async create(req, res) {
    try {
      const { usuario_id, partido_id, tipo_apuesta, monto } = req.body;

      if (!usuario_id || !partido_id || !tipo_apuesta || !monto) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      const nuevaApuesta = await ApuestaModel.create(req.body);
      res.status(201).json(nuevaApuesta);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  },

  async liquidar(req, res) {
    try {
      const { resultado } = req.body;
      const partido_id = req.params.partido_id;

      if (!['local', 'empate', 'visitante'].includes(resultado)) {
        return res.status(400).json({ error: 'Resultado inválido' });
      }

      const resultados = await ApuestaModel.liquidar(partido_id, resultado);
      res.json({ mensaje: 'Apuestas liquidadas', resultados });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al liquidar apuestas' });
    }
  }
};

module.exports = ApuestasController;