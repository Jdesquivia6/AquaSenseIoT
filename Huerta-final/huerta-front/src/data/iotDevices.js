import soilMoisture from '../images/soil-moisture.png';
import DHT22 from '../images/DHT22.png';
import waterPump from '../images/water-pump.png';
import solenoidValve from '../images/solenoid-valve.jpg';
import esp32 from '../images/esp32.png';

export const iotDevices = [
  {
    id: 1,
    name: 'Sensor de Humedad del Suelo',
    description: 'Mide el nivel de humedad en el suelo para optimizar el riego.',
    image: soilMoisture,
    type: 'sensor',
  },
  {
    id: 2,
    name: 'Sensor de Temperatura y Humedad DHT22',
    description: 'Registra la temperatura y la humedad ambiental.',
    image: DHT22,
    type: 'sensor',
  },
  {
    id: 3,
    name: 'Bomba de Agua',
    description: 'Activa el flujo de agua cuando el sistema lo requiere.',
    image: waterPump,
    type: 'actuator',
  },
  {
    id: 4,
    name: 'Válvula Solenoide',
    description: 'Controla la apertura o cierre del paso del agua.',
    image: solenoidValve,
    type: 'actuator',
  },
  {
    id: 5,
    name: 'Módulo ESP32',
    description: 'Control principal del sistema de riego inteligente.',
    image: esp32,
    type: 'controller',
  },
];
