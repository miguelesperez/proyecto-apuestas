const express = require('express');
const router = express.Router();
const UsuariosController = require('../controllers/usuariosController');

router.get('/', UsuariosController.getAll);
// OJO: /verificar va ANTES de /:id, si no Express creería que "verificar" es un id
router.get('/verificar', UsuariosController.verificar);
router.get('/:id', UsuariosController.getById);
router.post('/', UsuariosController.create);
router.put('/:id', UsuariosController.update);
router.delete('/:id', UsuariosController.delete);

router.post('/login', UsuariosController.login);
router.put('/:id/saldo', UsuariosController.actualizarSaldo);

module.exports = router;