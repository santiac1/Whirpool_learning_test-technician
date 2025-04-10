-- Este script añade una tabla de notificaciones al esquema de base de datos existente
USE whirlpool_learning;

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insertar algunas notificaciones de ejemplo para técnicos
INSERT INTO notifications (user_id, title, message, type) VALUES
(2, 'Nuevo curso disponible', 'Se ha asignado un nuevo curso a tu perfil: "Refrigerator Repair Basics".', 'info'),
(2, 'Quiz completado', 'Has completado el quiz "Refrigeration Basics Quiz" con una calificación de 75%.', 'success'),
(3, 'Recordatorio de curso', 'Tienes un curso en progreso que no has continuado en 3 días.', 'warning'),
(4, 'Felicitaciones', 'Has conseguido la insignia "Refrigeration Expert".', 'success'),
(5, 'Nuevo mensaje en el foro', 'Alguien ha respondido a tu pregunta en el foro.', 'info');