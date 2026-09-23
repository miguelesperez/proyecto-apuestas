require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apuestasRoutes = require('./src/routes/apuestasRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use('/api/apuestas', apuestasRoutes);

app.get('/', (req, res) => {
  res.json({ servicio: 'APUESTAS', estado: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Microservicio APUESTAS corriendo en http://localhost:${PORT}`);
});