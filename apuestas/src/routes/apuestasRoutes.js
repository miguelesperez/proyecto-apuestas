const express = require('express');
const router = express.Router();
const ApuestasController = require('../controllers/apuestasController');

router.get('/', ApuestasController.getAll);
router.get('/:id', ApuestasController.getById);
router.post('/', ApuestasController.create);
router.put('/liquidar/:partido_id', ApuestasController.liquidar);

module.exports = router;