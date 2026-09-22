const PartidoModel = require('../models/partidoModel');

const APUESTAS_SERVICE_URL = process.env.APUESTAS_SERVICE_URL || 'http://localhost:3003';

const PartidosController = {
  async getAll(req, res) {
    try {
      const partidos = await PartidoModel.getAll();
      res.json(partidos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener partidos' });
    }
  },

  async getById(req, res) {
    try {
      const partido = await PartidoModel.getById(req.params.id);
      if (!partido) {
        return res.status(404).json({ error: 'Partido no encontrado' });
      }
      res.json(partido);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener el partido' });
    }
  },

  async create(req, res) {
    try {
      const { equipo_local, equipo_visitante, fecha, cuota_local, cuota_empate, cuota_visitante } = req.body;

      if (!equipo_local || !equipo_visitante || !fecha || !cuota_local || !cuota_empate || !cuota_visitante) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      const nuevoPartido = await PartidoModel.create(req.body);
      res.status(201).json(nuevoPartido);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear el partido' });
    }
  },

  async update(req, res) {
    try {
      const existe = await PartidoModel.getById(req.params.id);
      if (!existe) {
        return res.status(404).json({ error: 'Partido no encontrado' });
      }

      const actualizado = await PartidoModel.update(req.params.id, req.body);
      res.json(actualizado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar el partido' });
    }
  },

  async delete(req, res) {
    try {
      const eliminado = await PartidoModel.delete(req.params.id);
      if (!eliminado) {
        return res.status(404).json({ error: 'Partido no encontrado' });
      }
      res.json({ mensaje: 'Partido eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar el partido' });
    }
  },

  async finalizar(req, res) {
    try {
      const { resultado } = req.body;

      if (!['local', 'empate', 'visitante'].includes(resultado)) {
        return res.status(400).json({ error: 'Resultado inválido. Debe ser local, empate o visitante' });
      }

      const partido = await PartidoModel.getById(req.params.id);
      if (!partido) {
        return res.status(404).json({ error: 'Partido no encontrado' });
      }

      const partidoFinalizado = await PartidoModel.finalizar(req.params.id, resultado);

      let liquidacion = { ok: false, detalle: 'No se intentó contactar a APUESTAS' };
      try {
        const respuesta = await fetch(`${APUESTAS_SERVICE_URL}/api/apuestas/liquidar/${req.params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resultado })
        });

        if (respuesta.ok) {
          liquidacion = { ok: true, detalle: await respuesta.json() };
        } else {
          liquidacion = { ok: false, detalle: `APUESTAS respondió con status ${respuesta.status}` };
        }
      } catch (err) {
        liquidacion = { ok: false, detalle: `No se pudo contactar a APUESTAS: ${err.message}` };
      }

      res.json({ partido: partidoFinalizado, liquidacion });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al finalizar el partido' });
    }
  }
};

module.exports = PartidosController;