require('dotenv').config();
const express = require('express');
const cors = require('cors');
const partidosRoutes = require('./src/routes/partidosRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/partidos', partidosRoutes);

app.get('/', (req, res) => {
  res.json({ servicio: 'PARTIDOS', estado: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Microservicio PARTIDOS corriendo en http://localhost:${PORT}`);
});