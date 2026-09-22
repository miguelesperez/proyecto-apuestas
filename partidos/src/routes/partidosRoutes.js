const express = require('express');
const router = express.Router();
const PartidosController = require('../controllers/partidosController');

router.get('/', PartidosController.getAll);
router.get('/:id', PartidosController.getById);
router.post('/', PartidosController.create);
router.put('/:id', PartidosController.update);
router.delete('/:id', PartidosController.delete);
router.put('/:id/finalizar', PartidosController.finalizar);

module.exports = router;