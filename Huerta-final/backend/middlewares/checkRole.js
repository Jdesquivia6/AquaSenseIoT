const db = require('../db');

function checkRole(rolesPermitidos) {
  return async (req, res, next) => {
    try {
      const { user_id } = req.headers; 

      if (!user_id) {
        return res.status(401).json({ success: false, message: 'user_id requerido en headers' });
      }

      const [rows] = await db.query(
        'SELECT id_rol FROM usuarios WHERE id = ?',
        [user_id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: ' Usuario no encontrado' });
      }

      const userRole = rows[0].rol_id;

      if (!rolesPermitidos.includes(userRole)) {
        return res.status(403).json({ success: false, message: ' Acceso denegado' });
      }

      next();
    } catch (error) {
      console.error(' Error en checkRole:', error);
      res.status(500).json({ success: false, message: ' Error en validación de rol' });
    }
  };
}

module.exports = checkRole;
