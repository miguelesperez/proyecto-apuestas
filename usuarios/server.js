require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const usuariosRoutes = require('./src/routes/usuariosRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use('/api/usuarios', usuariosRoutes);

app.get('/', (req, res) => {
  res.json({ servicio: 'USUARIOS', estado: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Microservicio USUARIOS corriendo en http://localhost:${PORT}`);
});