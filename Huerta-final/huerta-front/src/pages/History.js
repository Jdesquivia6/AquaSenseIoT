import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Calendar as CalendarIcon, History as HistoryIcon, RefreshCw, Download, TrendingUp, Droplets } from 'lucide-react';
import { statsAPI, devicesAPI } from '../utils/api';
import { toast } from 'sonner';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

const History = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [days, setDays] = useState(7);
  const [records, setRecords] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadHistory();
    }
  }, [selectedDevice, days]);

  const loadDevices = async () => {
    try {
      const response = await devicesAPI.getAll();
      setDevices(response.data);
      if (response.data.length > 0) {
        setSelectedDevice(response.data[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Error al cargar dispositivos');
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await statsAPI.getHistory(selectedDevice, days);
      setRecords(response.data.records);

      // Prepare chart data - group by hour
      const grouped = {};
      response.data.records.forEach((record) => {
        const date = new Date(record.timestamp);
        const key = `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:00`;
        
        if (!grouped[key]) {
          grouped[key] = { time: key, humidity: [], pump: 0 };
        }
        grouped[key].humidity.push(parseFloat(record.humidity));
        if (record.pump_active) grouped[key].pump++;
      });

      const chartData = Object.values(grouped).map((item) => ({
        time: item.time,
        humidity: (item.humidity.reduce((a, b) => a + b, 0) / item.humidity.length).toFixed(1),
        pump: item.pump,
      }));

      setChartData(chartData);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Error al cargar historial');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Fecha', 'Humedad (%)', 'Valor Raw', 'Bomba Activa'],
      ...records.map((r) => [
        new Date(r.timestamp).toLocaleString('es-ES'),
        r.humidity,
        r.raw_value,
        r.pump_active ? 'Sí' : 'No',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_${selectedDevice}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Historial exportado');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = records.length > 0 ? {
    avg: (records.reduce((sum, r) => sum + parseFloat(r.humidity), 0) / records.length).toFixed(1),
    min: Math.min(...records.map(r => parseFloat(r.humidity))).toFixed(1),
    max: Math.max(...records.map(r => parseFloat(r.humidity))).toFixed(1),
    pumpActivations: records.filter(r => r.pump_active).length,
  } : null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Historial de Datos</h1>
          <p className="text-muted-foreground mt-1">Registros y estadísticas</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadHistory}
            variant="outline"
            data-testid="history-refresh-button"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          {records.length > 0 && (
            <Button onClick={handleExport} data-testid="history-export-button">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Dispositivo:</span>
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger className="w-64" data-testid="history-device-selector">
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
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
            <SelectTrigger className="w-40" data-testid="history-period-selector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Último día</SelectItem>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={itemVariants}>
            <Card className="card-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Humedad Promedio</p>
                    <p className="text-3xl font-semibold mt-1">{stats.avg}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="card-shadow">
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Mínima / Máxima</p>
                  <p className="text-2xl font-semibold mt-1">{stats.min}% / {stats.max}%</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="card-shadow">
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Activaciones de Bomba</p>
                  <p className="text-3xl font-semibold mt-1">{stats.pumpActivations}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="card-shadow">
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Registros</p>
                  <p className="text-3xl font-semibold mt-1">{records.length}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Chart */}
      <motion.div variants={itemVariants}>
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia de Humedad
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Humedad (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Droplets className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No hay datos en el período seleccionado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5" />
              Registros Detallados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No hay registros en el período seleccionado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Humedad</TableHead>
                      <TableHead>Valor Raw</TableHead>
                      <TableHead>Estado Bomba</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.slice(0, 100).map((record, index) => (
                      <TableRow key={`${record.id}-${index}`} data-testid={`history-row-${index}`}>
                        <TableCell className="text-sm">
                          {new Date(record.timestamp).toLocaleString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{parseFloat(record.humidity).toFixed(1)}%</span>
                            {parseFloat(record.humidity) < 30 && (
                              <Badge variant="destructive" className="text-xs">Bajo</Badge>
                            )}
                            {parseFloat(record.humidity) > 70 && (
                              <Badge variant="default" className="text-xs">Alto</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{record.raw_value}</TableCell>
                        <TableCell>
                          <Badge variant={record.pump_active ? 'default' : 'secondary'}>
                            <span className={`status-dot ${record.pump_active ? 'status-online' : 'status-offline'} mr-2`} />
                            {record.pump_active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {records.length > 100 && (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Mostrando los primeros 100 de {records.length} registros. Exporta para ver todos.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default History;
