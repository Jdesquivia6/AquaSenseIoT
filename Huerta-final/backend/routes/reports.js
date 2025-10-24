const express = require('express');
const router = express.Router();
const axios = require('axios');

// Ejemplo de datos en tiempo real desde ESP32
router.get('/humedad', async (req, res) => {
  try {
    const response = await axios.get('http://192.168.1.2/humedad', { timeout: 4000 });
    const data = response.data;

    // Formatear datos para el frontend
    const formatted = {
      timestamp: new Date().toISOString(),
      humedad: data.humedad,
      raw: data.valorRaw,
      bombaActiva: data.bombaActiva,
      humedadMin: data.humedadMinima,
      humedadMax: data.humedadMaxima,
      sensorOK: data.sensorOK,
      lcdOK: data.lcdOK
    };

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error obteniendo datos del ESP32:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


router.get('/otra', async (req, res) => {
  try {
    // Aquí generas los datos para el "otro" reporte
    const data = [
      { ejemplo: 1, valor: 123 },
      { ejemplo: 2, valor: 456 },
    ];
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;
