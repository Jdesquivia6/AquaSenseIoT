const express = require('express');
const db = require('../db');
const router = express.Router();
const checkRole = require('../middlewares/checkRole');

// Ruta para guardar datos de humedad
router.post('/humedad', checkRole([2]),async (req, res) => {
  const { dispositivo_id, humedad, valor_raw, bomba_activa } = req.body;

  console.log("👉 Datos recibidos:", req.body); // Para depurar

  // Validación de tipos (cast explícito)
  const id = Number(dispositivo_id);
  const hum = Number(humedad);
  const raw = Number(valor_raw);
  const bomba = bomba_activa === true || bomba_activa === 'true'; // admite boolean o string

  // Validar que los datos sean numéricos y válidos
  if (
    isNaN(id) ||
    isNaN(hum) ||
    isNaN(raw) ||
    typeof bomba !== 'boolean'
  ) {
    return res.status(400).json({
      success: false,
      message: '❌ Datos inválidos. Verifica los tipos.',
    });
  }

  try {
    await db.query(
      `INSERT INTO registros_humedad (dispositivo_id, humedad, valor_raw, bomba_activa)
       VALUES (?, ?, ?, ?)`,
      [id, hum, raw, bomba]
    );

    res.json({ success: true, message: '✅ Registro guardado correctamente' });
  } catch (err) {
    console.error('💥 Error al guardar humedad:', err);
    res.status(500).json({
      success: false,
      message: '💥 Error del servidor al guardar datos',
    });
  }
});

// Ruta para obtener los últimos registros
router.get('/humedad/:dispositivo_id', checkRole([1, 2]),async (req, res) => {
  const { dispositivo_id } = req.params;

  try {
    const [registros] = await db.query(
      `SELECT * FROM registros_humedad
       WHERE dispositivo_id = ?
       ORDER BY fecha_registro DESC
       LIMIT 50`,
      [dispositivo_id]
    );

    res.json({ success: true, registros });
  } catch (err) {
    console.error('💥 Error al obtener registros:', err);
    res.status(500).json({
      success: false,
      message: '💥 Error al consultar registros en la base de datos',
    });
  }
});

module.exports = router;
