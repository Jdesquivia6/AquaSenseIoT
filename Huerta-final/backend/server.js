const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const db = require('./db');

const app = express();
const PORT = 4000;

// --- CONFIGURACIONES EXISTENTES ---
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:5500", "*", "http://192.168.1.2"],
  methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user_id'],
  credentials: true
}));

app.use(bodyParser.json());

// --- RUTAS EXISTENTES ---
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ success: true, result: rows[0].result });
  } catch (error) {
    console.error('Error al conectar con la BD:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/humedad'));
app.use('/api', require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));


// --- Servidor HTTP + WebSocket ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

// Cliente conectado
io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado al WebSocket');
  socket.on('disconnect', () => console.log('🔴 Cliente desconectado'));
});

// --- 🔥 POLL del ESP32 cada 5 s ---
const ARDUINO_IP = 'http://192.168.1.2'; // cambia si tu IP cambia
let ultimoDato = {};

// 🧠 Función para emitir alertas en tiempo real
function emitirAlerta(tipo, nivel, mensaje) {
  const alerta = {
    id: Date.now(),
    level: nivel, // 'critical', 'warning', 'info'
    type: tipo,
    message: mensaje,
    created_at: new Date().toISOString(),
    resolved: false,
  };
  console.log("🚨 Enviando alerta en tiempo real:", alerta);
  io.emit("alerta-nueva", alerta);
}

// 📡 Obtener datos del ESP32 cada 5 segundos
setInterval(async () => {
  try {
    const response = await axios.get(`${ARDUINO_IP}/humedad`, { timeout: 4000 });
    const data = response.data;

    // ✅ Extraemos todos los valores relevantes
    const payload = {
      timestamp: new Date().toISOString(),
      humidity: data.humedad ?? 0,
      raw: data.valorRaw ?? 0,
      pump: data.bombaActiva ?? false,
      humidityMin: data.humedadMinima ?? 0,
      humidityMax: data.humedadMaxima ?? 0,
      sensorOK: data.sensorOK ?? false,
      lcdOK: data.lcdOK ?? false,
      ip: data.ip ?? 'N/A',
      status: data.status ?? 'unknown'
    };

    // ✅ Emitimos al dashboard en tiempo real
    io.emit('sensor-data', payload);
    ultimoDato = payload;

    console.log('📡 Dato real enviado al dashboard:', payload);

    // 🚨 Generar alertas automáticas según condiciones
    if (!data.sensorOK) {
      emitirAlerta("sensor_status", "error", "Sensor de humedad desconectado");
    } else if (data.humedad < data.humedadMinima) {
      emitirAlerta("sensor_humidity", "warning", `Humedad baja detectada (${data.humedad}%)`);
    } else if (data.humedad > data.humedadMaxima) {
      emitirAlerta("sensor_humidity", "warning", `Humedad alta detectada (${data.humedad}%)`);
    } else if (!data.lcdOK) {
      emitirAlerta("lcd_status", "info", "Pantalla LCD reiniciada o no detectada");
    }

  } catch (error) {
    console.error('❌ Error obteniendo datos del ESP32:', error.message);

    // ⚙️ Si el ESP no responde, reenviamos el último dato válido
    io.emit('sensor-data', ultimoDato);

    // 🚨 Emitir alerta de conexión
    emitirAlerta("connection", "critical", "Fallo de conexión con el ESP32");
  }
}, 5000);

// --- INICIAR SERVIDOR ---
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
