CREATE DATABASE IF NOT EXISTS reservas_equipos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reservas_equipos;

CREATE TABLE IF NOT EXISTS equipos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  tipo ENUM('Laptop','Proyector','Tablet','Cámara','Laboratorio') NOT NULL,
  descripcion VARCHAR(255) NULL,
  ubicacion VARCHAR(100) NOT NULL,
  estado ENUM('Disponible','Mantenimiento') NOT NULL DEFAULT 'Disponible',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT UNSIGNED NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  carne VARCHAR(20) NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  motivo VARCHAR(255) NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reserva_equipo FOREIGN KEY (equipo_id) REFERENCES equipos(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_horas CHECK (hora_fin > hora_inicio),
  INDEX idx_equipo_fecha (equipo_id, fecha)
) ENGINE=InnoDB;

INSERT IGNORE INTO equipos (codigo,nombre,tipo,descripcion,ubicacion,estado) VALUES
('LAP-001','Laptop Dell Latitude 5420','Laptop','Intel Core i5, 16 GB RAM','Bodega T1','Disponible'),
('LAP-002','Laptop HP ProBook 450','Laptop','Intel Core i5, 8 GB RAM','Bodega T1','Disponible'),
('LAP-003','MacBook Air M2','Laptop','Apple M2, 8 GB RAM','Bodega T1','Disponible'),
('PRO-001','Proyector Epson PowerLite','Proyector','HDMI, 3,600 lúmenes','Edificio A','Disponible'),
('PRO-002','Proyector BenQ MX550','Proyector','XGA, HDMI','Edificio B','Disponible'),
('TAB-001','iPad 10.ª generación','Tablet','64 GB, Wi-Fi','Bodega T1','Disponible'),
('TAB-002','Samsung Galaxy Tab S9','Tablet','128 GB, Wi-Fi','Bodega T1','Disponible'),
('CAM-001','Cámara Canon EOS R50','Cámara','Kit con lente 18-45 mm','Auditorio','Disponible'),
('LAB-001','Laboratorio de Cómputo 1','Laboratorio','30 estaciones de trabajo','Edificio A, nivel 2','Disponible'),
('LAB-002','Laboratorio de Redes','Laboratorio','Prácticas de redes y servidores','Edificio B, nivel 1','Disponible');
