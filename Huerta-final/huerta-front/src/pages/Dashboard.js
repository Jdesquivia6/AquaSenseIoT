import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Activity, Droplets, AlertTriangle, Database, RefreshCw } from 'lucide-react';
import { statsAPI, devicesAPI, humidityAPI } from '../utils/api';
import { toast } from 'sonner';
import { io } from "socket.io-client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();

    // Conectamos al servidor WebSocket
    const socket = io("http://localhost:4000", {
      transports: ["websocket"],
    });

    // Escuchamos los datos en tiempo real
    socket.on("sensor-data", (data) => {
      console.log("📡 Nuevo dato recibido:", data);

      setLiveData((prevData) => {
        const updated = [
          ...prevData,
          {
            t: new Date().toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            humidity: data.humidity ?? 0,
            raw: data.raw ?? 0,
            pump: data.pump ? 1 : 0,
            min: data.humidityMin ?? 0,
            max: data.humidityMax ?? 0,
            sensorOK: data.sensorOK ?? false,
            lcdOK: data.lcdOK ?? false,
            status: data.status ?? "unknown",
            ip: data.ip ?? "N/A",
          },
        ];
        return updated.slice(-30);
      });
    });

    // Limpieza al desmontar el componente
    return () => {
      socket.disconnect();
    };
  }, []);



  const loadData = async () => {
    try {
      const [statsRes, devicesRes] = await Promise.all([
        statsAPI.getDashboard(),
        devicesAPI.getAll(),
      ]);

      setStats(statsRes.data);
      setDevices(devicesRes.data);

      if (devicesRes.data.length > 0 && !selectedDevice) {
        setSelectedDevice(devicesRes.data[0].id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos del dashboard');
      setLoading(false);
    }
  };

  const loadLiveData = async () => {
    if (!selectedDevice) return;

    try {
      const response = await humidityAPI.getByDevice(selectedDevice, 20);
      const formattedData = response.data
        .reverse()
        .map((record) => ({
          t: new Date(record.timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          humidity: parseFloat(record.humidity),
          raw: record.raw_value,
          pump: record.pump_active ? 1 : 0,
        }));

      setLiveData(formattedData);
    } catch (error) {
      console.error('Error loading live data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await loadLiveData();
    setRefreshing(false);
    toast.success('Datos actualizados');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Dashboard de Riego</h1>
          <p className="text-muted-foreground mt-1">Monitoreo en tiempo real</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          data-testid="dashboard-refresh-button"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      

      {/* Live Sensor Info */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
  <motion.div variants={itemVariants}>
    <Card className="card-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Humedad Actual</p>
            <p className="text-3xl font-semibold mt-1">
              {liveData.length > 0 ? `${liveData[liveData.length - 1].humidity}%` : '--'}
            </p>
          </div>
          <Droplets className="h-10 w-10 text-primary" />
        </div>
      </CardContent>
    </Card>
  </motion.div>

  <motion.div variants={itemVariants}>
    <Card className="card-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Bomba Activa</p>
            <p className="text-3xl font-semibold mt-1">
              {liveData.length > 0
                ? liveData[liveData.length - 1].pump
                  ? '✅ Sí'
                  : '❌ No'
                : '--'}
            </p>
          </div>
          <Activity
            className={`h-10 w-10 ${
              liveData.length > 0 && liveData[liveData.length - 1].pump
                ? 'text-green-500'
                : 'text-red-500'
            }`}
          />
        </div>
      </CardContent>
    </Card>
  </motion.div>

  <motion.div variants={itemVariants}>
    <Card className="card-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Sensor / LCD</p>
            <p className="text-lg font-medium mt-1">
              {liveData.length > 0
                ? liveData[liveData.length - 1].sensorOK && liveData[liveData.length - 1].lcdOK
                  ? '🟢 Correcto'
                  : '🔴 Error'
                : '--'}
            </p>
          </div>
          <AlertTriangle className="h-10 w-10 text-yellow-500" />
        </div>
      </CardContent>
    </Card>
  </motion.div>

  <motion.div variants={itemVariants}>
          <Card data-testid="stat-total-devices" className="card-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dispositivo Online</p>
                  <p className="text-3xl font-semibold mt-1">{liveData.length > 0 ? `${liveData[liveData.length - 1].status}` : '--'}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/50 flex items-center justify-center">
                  <Droplets className="h-6 w-6 text-accent-foreground" />
                </div>
              </div>
              <Badge variant="secondary" className="mt-3">ESP32 Activo</Badge>
            </CardContent>
          </Card>
        </motion.div>
</div>

      {/* Device Selector */}
      {devices.length > 0 && (
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Dispositivo:</span>
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger className="w-64" data-testid="device-selector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem key={device.id} value={device.id}>
                  {device.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {/* Humidity Live Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <Card data-testid="humidity-live-card" className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                Humedad en Tiempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liveData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={liveData}>
                    <defs>
                      <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="t" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="humidity"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      fill="url(#humidityGradient)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Droplets className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No hay datos disponibles</p>
                    <p className="text-sm">Selecciona un dispositivo activo</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>



        {/* Raw Values Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-6">
          <Card data-testid="raw-values-card" className="card-shadow">
            <CardHeader>
              <CardTitle>Valores del Sensor (Raw)</CardTitle>
            </CardHeader>
            <CardContent>
              {liveData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={liveData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="t" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="raw"
                      stroke="hsl(var(--chart-4))"
                      strokeWidth={2}
                      dot={false}
                      name="Valor Raw"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  <p>No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
