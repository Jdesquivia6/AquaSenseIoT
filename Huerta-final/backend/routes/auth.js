const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

// Registro
router.post('/register', async (req, res) => {
  const { usuario, password, rol_id } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    
    const rol = rol_id || 1;

    await db.query(
      'INSERT INTO usuarios (usuario, password, id_rol) VALUES (?, ?, ?)',
      [usuario, hash, rol]
    );

    res.json({ success: true, message: '✅ ¡Usuario registrado con éxito!' });
  } catch (err) {
    res.json({ success: false, message: '❌ Error al registrar: ' + err.message });
  }
});

router.post('/login', async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT id, usuario, password, id_rol FROM usuarios WHERE usuario = ?',
      [usuario]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: '❌ Usuario no encontrado' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ success: false, message: '❌ Contraseña incorrecta' });
    }

    console.log("Usuario logueado:", user);

   
    res.json({
      success: true,
      message: `✅ Bienvenido ${user.usuario}`,
      user: {
        id: user.id,
        username: user.usuario,
        rol_id: user.id_rol
      },
      token: "fake-token-demo" 
    });

  } catch (err) {
    res.json({ success: false, message: '💥 Error en login: ' + err.message });
  }
});

module.exports = router;
