const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, usuario, id_rol FROM usuarios ORDER BY id ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    const validRoles = [1, 2, 3];
    if (!validRoles.includes(role_id)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const [userExists] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (userExists.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await db.query('UPDATE usuarios SET id_rol = ? WHERE id = ?', [role_id, id]);

    res.json({ message: '✅ Rol actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el rol:', error);
    res.status(500).json({ message: 'Error al actualizar el rol' });
  }
});

module.exports = router;
