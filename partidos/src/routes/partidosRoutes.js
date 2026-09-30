const express = require('express');
const router = express.Router();
const PartidosController = require('../controllers/partidosController');
const verificarAdmin = require('../middlewares/verificarAdmin');

// Consultar partidos: cualquiera (los apostadores necesitan verlos)
router.get('/', PartidosController.getAll);
router.get('/:id', PartidosController.getById);

// Crear, modificar, eliminar y finalizar: SOLO ADMIN.
// verificarAdmin corre antes del controlador y consulta a USUARIOS.
router.post('/', verificarAdmin, PartidosController.create);
router.put('/:id', verificarAdmin, PartidosController.update);
router.delete('/:id', verificarAdmin, PartidosController.delete);
router.put('/:id/finalizar', verificarAdmin, PartidosController.finalizar);

module.exports = router;