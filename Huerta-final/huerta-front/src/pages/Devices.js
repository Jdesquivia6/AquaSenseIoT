import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Pencil, Trash2, HardDrive, RefreshCw } from 'lucide-react';
import { devicesAPI } from '../utils/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { iotDevices } from '../data/iotDevices';


const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ip_address: '',
    location: '',
    humidity_min: 40,
    humidity_max: 65,
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await devicesAPI.getAll();
      setDevices(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Error al cargar dispositivos');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingDevice) {
        await devicesAPI.update(editingDevice.id, formData);
        toast.success('Dispositivo actualizado');
      } else {
        await devicesAPI.create(formData);
        toast.success('Dispositivo creado');
      }

      setDialogOpen(false);
      resetForm();
      loadDevices();
    } catch (error) {
      console.error('Error saving device:', error);
      toast.error(error.response?.data?.detail || 'Error al guardar dispositivo');
    }
  };

  const handleEdit = (device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      description: device.description || '',
      ip_address: device.ip_address,
      location: device.location || '',
      humidity_min: device.humidity_min,
      humidity_max: device.humidity_max,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (deviceId) => {
    if (!window.confirm('¿Estás seguro de eliminar este dispositivo?')) return;

    try {
      await devicesAPI.delete(deviceId);
      toast.success('Dispositivo eliminado');
      loadDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Error al eliminar dispositivo');
    }
  };

  const resetForm = () => {
    setEditingDevice(null);
    setFormData({
      name: '',
      description: '',
      ip_address: '',
      location: '',
      humidity_min: 40,
      humidity_max: 65,
    });
  };

  const isDeviceOnline = (lastConnection) => {
    if (!lastConnection) return false;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return new Date(lastConnection) > tenMinutesAgo;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
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

  return (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="space-y-6"
  >
    {/* ---------- ENCABEZADO ---------- */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Dispositivos ESP32</h1>
        <p className="text-muted-foreground mt-1">Gestiona tus dispositivos de riego</p>
      </div>
      {isAdmin && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-device-button" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Dispositivo
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="device-dialog">
            <DialogHeader>
              <DialogTitle>{editingDevice ? 'Editar' : 'Nuevo'} Dispositivo</DialogTitle>
            </DialogHeader>
            {/* ---------- FORMULARIO ---------- */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos del formulario */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ip">Dirección IP</Label>
                <Input
                  id="ip"
                  placeholder="192.168.1.100"
                  value={formData.ip_address}
                  onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Jardín principal"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="humidity_min">Humedad Mínima (%)</Label>
                  <Input
                    id="humidity_min"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.humidity_min}
                    onChange={(e) => setFormData({ ...formData, humidity_min: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="humidity_max">Humedad Máxima (%)</Label>
                  <Input
                    id="humidity_max"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.humidity_max}
                    onChange={(e) => setFormData({ ...formData, humidity_max: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingDevice ? 'Actualizar' : 'Crear'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>

    {/* ---------- LISTADO DE DISPOSITIVOS REGISTRADOS ---------- */}
    <motion.div variants={itemVariants}>
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Listado de Dispositivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HardDrive className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No hay dispositivos registrados</p>
              {isAdmin && <p className="text-sm mt-1">Agrega tu primer dispositivo ESP32</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Humedad</TableHead>
                    <TableHead>Última Conexión</TableHead>
                    {isAdmin && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => {
                    const online = isDeviceOnline(device.last_connection);
                    return (
                      <TableRow key={device.id}>
                        <TableCell>
                          <Badge variant={online ? 'default' : 'secondary'}>
                            <span className={`status-dot ${online ? 'status-online' : 'status-offline'} mr-2`} />
                            {online ? 'Online' : 'Offline'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{device.name}</TableCell>
                        <TableCell className="font-mono text-sm">{device.ip_address}</TableCell>
                        <TableCell>{device.location || '-'}</TableCell>
                        <TableCell>
                          {device.humidity_min}% - {device.humidity_max}%
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {device.last_connection
                            ? new Date(device.last_connection).toLocaleString('es-ES')
                            : 'Nunca'}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(device)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(device.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>

    {/* ---------- SECCIÓN DE SENSORES E IOT DEVICES ---------- */}
    <motion.div variants={itemVariants}>
      <Card className="card-shadow mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Sensores y Dispositivos IoT
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Estos son los componentes disponibles en el sistema de riego inteligente.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {iotDevices.map((device) => (
              <motion.div
                key={device.id}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <img
                  src={device.image}
                  alt={device.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg">{device.name}</h3>
                  <p className="text-sm text-muted-foreground">{device.description}</p>
                  <Badge
                    variant={
                      device.type === 'sensor'
                        ? 'secondary'
                        : device.type === 'actuator'
                        ? 'default'
                        : 'outline'
                    }
                  >
                    {device.type.charAt(0).toUpperCase() + device.type.slice(1)}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  </motion.div>
);
};

export default Devices;
