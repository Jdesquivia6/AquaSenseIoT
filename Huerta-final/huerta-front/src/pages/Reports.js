import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { reportsAPI } from '../utils/api';
import { toast } from 'sonner';

const Reports = () => {
  const [reportType, setReportType] = useState('1');
  const [filter, setFilter] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // useCallback para no romper la regla de dependencias de useEffect
  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getReport(reportType, filter);
      setData(response.data);
    } catch (error) {
      console.error('Error cargando reporte:', error);
      toast.error('Error al cargar reporte');
    } finally {
      setLoading(false);
    }
  }, [reportType, filter]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-semibold">Reportes del Sistema</h1>

      <div className="flex gap-4">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Seleccione un reporte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Reporte Humedad</SelectItem>
            <SelectItem value="2">Otro Reporte</SelectItem>
          </SelectContent>
        </Select>

        <input
          type="text"
          placeholder="Filtrar..."
          className="pl-3 pr-3 py-2 border rounded-md"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />

        <Button onClick={loadReport}>Actualizar</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {data.length > 0 && Object.keys(data[0]).map((key) => (
                  <TableHead key={key}>{key}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx}>
                  {Object.values(row).map((value, i) => (
                    <TableCell key={i}>{String(value)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {loading && <p>Cargando datos...</p>}
          {!loading && data.length === 0 && <p>No hay datos para mostrar.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
