import { io } from 'socket.io-client';
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Bell, Search } from 'lucide-react';
import { alertsAPI } from '../utils/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [filter, setFilter] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

useEffect(() => {
  loadAlerts(); // carga inicial desde API

  // 🔌 Conectar al WebSocket de Socket.IO
  const socket = io('http://localhost:4000');

  socket.on('connect', () => console.log('🟢 Conectado al WS de alertas'));
  socket.on('disconnect', () => console.log('🔴 Desconectado del WS de alertas'));

  // Escuchar nuevas alertas
  socket.on('alerta-nueva', (newAlert) => {
    console.log('🚨 Alerta recibida en frontend:', newAlert);
    setAlerts((prev) => [newAlert, ...prev]); // añadir al inicio
    toast.warning(`Nueva alerta: ${newAlert.message}`);
  });

  return () => socket.disconnect(); // limpieza al desmontar
}, [activeTab]);


  const loadAlerts = async () => {
    try {
      setLoading(true);
      const resolved = activeTab === 'resolved' ? true : activeTab === 'pending' ? false : null;
      const response = await alertsAPI.getAll(resolved);
      setAlerts(response.data);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId) => {
    if (!isAdmin) return toast.error('Solo administradores pueden resolver alertas');
    try {
      await alertsAPI.resolve(alertId);
      toast.success('Alerta resuelta');
      loadAlerts();
    } catch (error) {
      toast.error('Error al resolver alerta');
    }
  };

  const getAlertIcon = (level) => {
    switch (level) {
      case 'critical': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'error': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Bell className="h-5 w-5 text-primary" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getAlertBadge = (level) => {
    const variants = { critical: 'destructive', error: 'destructive', warning: 'secondary', info: 'default' };
    return variants[level] || 'secondary';
  };

  const getLevelLabel = (level) => {
    const labels = { critical: 'Crítica', error: 'Error', warning: 'Advertencia', info: 'Información' };
    return labels[level] || level;
  };

  const pendingCount = alerts.filter((a) => !a.resolved).length;

const filteredAlerts = useMemo(() => {
  return alerts
    .filter((a) => {
      if (activeTab === 'pending') return !a.resolved;
      if (activeTab === 'resolved') return a.resolved;
      return true; // 'all'
    })
    .filter((a) =>
      a.message.toLowerCase().includes(filter.toLowerCase()) ||
      a.type.toLowerCase().includes(filter.toLowerCase())
    );
}, [alerts, activeTab, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Alertas del Sistema</h1>
          <p className="text-muted-foreground mt-1">Notificaciones y eventos en tiempo real</p>
        </div>
        <Button onClick={loadAlerts} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Panel de resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground">Críticas</p><h3 className="text-2xl font-bold text-destructive">{alerts.filter(a => a.level === 'critical').length}</h3></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground">Advertencias</p><h3 className="text-2xl font-bold text-yellow-500">{alerts.filter(a => a.level === 'warning').length}</h3></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground">Info</p><h3 className="text-2xl font-bold text-primary">{alerts.filter(a => a.level === 'info').length}</h3></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-muted-foreground">Pendientes</p><h3 className="text-2xl font-bold">{pendingCount}</h3></CardContent></Card>
      </div>

      {/* Buscador */}
      <div className="relative w-full md:w-1/2">
        <Search className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Buscar por mensaje o tipo..."
          className="pl-9 pr-3 py-2 w-full border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount} pendientes
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="resolved">Resueltas</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No hay alertas {activeTab === 'pending' ? 'pendientes' : activeTab === 'resolved' ? 'resueltas' : ''}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nivel</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Mensaje</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        {isAdmin && <TableHead>Acciones</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getAlertIcon(alert.level)}
                              <Badge variant={getAlertBadge(alert.level)}>
                                {getLevelLabel(alert.level)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{alert.type.replace('_', ' ')}</TableCell>
                          <TableCell className="max-w-md">{alert.message}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString('es-ES')}
                          </TableCell>
                          <TableCell>
                            {alert.resolved ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" /> Resuelta
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <AlertTriangle className="h-3 w-3" /> Pendiente
                              </Badge>
                            )}
                          </TableCell>
                          {isAdmin && !alert.resolved && (
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)}>
                                Resolver
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Alerts;
