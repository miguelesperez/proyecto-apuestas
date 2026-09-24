CREATE DATABASE IF NOT EXISTS apuestas_db;
USE apuestas_db;

CREATE TABLE IF NOT EXISTS apuestas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  email VARCHAR(150) NOT NULL,
  partido_id INT NOT NULL,
  tipo_apuesta ENUM('local', 'empate', 'visitante') NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  cuota_aplicada DECIMAL(5,2) NOT NULL,
  ganancia_potencial DECIMAL(10,2) NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('pendiente', 'ganada', 'perdida') NOT NULL DEFAULT 'pendiente'
);