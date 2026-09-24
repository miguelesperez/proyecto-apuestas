CREATE DATABASE IF NOT EXISTS partidos_db;
USE partidos_db;

CREATE TABLE IF NOT EXISTS partidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_local VARCHAR(100) NOT NULL,
  equipo_visitante VARCHAR(100) NOT NULL,
  fecha DATETIME NOT NULL,
  cuota_local DECIMAL(5,2) NOT NULL,
  cuota_empate DECIMAL(5,2) NOT NULL,
  cuota_visitante DECIMAL(5,2) NOT NULL,
  estado ENUM('programado', 'en_curso', 'finalizado', 'cancelado') NOT NULL DEFAULT 'programado',
  resultado ENUM('local', 'empate', 'visitante') DEFAULT NULL
);