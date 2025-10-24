// import React, { useState, useEffect, useRef } from "react";
// import { motion } from "framer-motion";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { toast } from "sonner";
// import {
//   Droplets,
//   RefreshCw,
//   Activity,
//   AlertTriangle,
//   Database,
// } from "lucide-react";
// import {
//   ResponsiveContainer,
//   AreaChart,
//   Area,
//   LineChart,
//   Line,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip,
//   BarChart,
//   Bar,
//   Legend,
// } from "recharts";
// import { statsAPI, devicesAPI, humidityAPI } from "../utils/api";

// // Base local para guardar registros del ESP
// const LocalDB = {
//   obtenerRegistros: () =>
//     JSON.parse(localStorage.getItem("historial_humedad") || "[]"),
//   guardarRegistro: (data) => {
//     const registros = JSON.parse(localStorage.getItem("historial_humedad") || "[]");
//     registros.push({ ...data, fecha: new Date().toISOString() });
//     if (registros.length > 50) registros.shift();
//     localStorage.setItem("historial_humedad", JSON.stringify(registros));
//   },
// };

// export default function Dashboard() {
//   const [espIP, setEspIP] = useState(localStorage.getItem("espIP") || "");
//   const [conectado, setConectado] = useState(false);
//   const [humedad, setHumedad] = useState(null);
//   const [valorRaw, setValorRaw] = useState(null);
//   const [bombaActiva, setBombaActiva] = useState(false);
//   const [historial, setHistorial] = useState(LocalDB.obtenerRegistros());
//   const intervaloRef = useRef(null);
//   const [loading, setLoading] = useState(false);

//   // Backend data
//   const [stats, setStats] = useState(null);
//   const [devices, setDevices] = useState([]);
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [liveData, setLiveData] = useState([]);
//   const [refreshing, setRefreshing] = useState(false);

//   // ---------- ESP32 ----------
//   useEffect(() => {
//     localStorage.setItem("espIP", espIP);
//   }, [espIP]);

//   const iniciarMonitoreo = () => {
//     if (intervaloRef.current) clearInterval(intervaloRef.current);
//     intervaloRef.current = setInterval(obtenerDatosHumedad, 3000);
//     obtenerDatosHumedad();
//   };

//   const obtenerDatosHumedad = async () => {
//     if (!espIP || !conectado) return;
//     try {
//       const res = await fetch(`${espIP}/humedad`);
//       const data = await res.json();

//       setHumedad(data.humedad);
//       setValorRaw(data.valorRaw);
//       setBombaActiva(data.bombaActiva);

//       LocalDB.guardarRegistro(data);
//       setHistorial(LocalDB.obtenerRegistros());
//     } catch (error) {
//       console.error("❌ Error obteniendo datos:", error);
//       setConectado(false);
//     }
//   };

//   const probarConexion = async () => {
//     if (!espIP) {
//       toast.error("Ingresa la IP del ESP32");
//       return;
//     }
//     const url = espIP.startsWith("http") ? espIP : `http://${espIP}`;
//     setLoading(true);
//     try {
//       const res = await fetch(`${url}/info`);
//       if (!res.ok) throw new Error("ESP32 no responde");
//       setConectado(true);
//       toast.success("✅ Conexión exitosa con ESP32");
//       iniciarMonitoreo();
//     } catch (err) {
//       setConectado(false);
//       toast.error("❌ Error conectando con ESP32");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const cambiarBomba = async (accion) => {
//     if (!espIP || !conectado) {
//       toast.error("No hay conexión con el ESP32");
//       return;
//     }
//     try {
//       const endpoint = `${espIP}/manual?accion=${accion}`;
//       const res = await fetch(endpoint);
//       if (res.ok) {
//         toast.success(
//           accion === "activar" ? "💧 Bomba activada" : "⏹️ Bomba desactivada"
//         );
//         obtenerDatosHumedad();
//       }
//     } catch {
//       toast.error("Error cambiando estado de la bomba");
//     }
//   };

//   // ---------- BACKEND ----------
//   useEffect(() => {
//     loadData();
//     const interval = setInterval(loadLiveData, 5000);
//     return () => clearInterval(interval);
//   }, [selectedDevice]);

//   const loadData = async () => {
//     try {
//       const [statsRes, devicesRes] = await Promise.all([
//         statsAPI.getDashboard(),
//         devicesAPI.getAll(),
//       ]);
//       setStats(statsRes.data);
//       setDevices(devicesRes.data);
//       if (devicesRes.data.length > 0 && !selectedDevice)
//         setSelectedDevice(devicesRes.data[0].id);
//     } catch {
//       toast.error("Error al cargar datos del dashboard");
//     }
//   };

//   const loadLiveData = async () => {
//     if (!selectedDevice) return;
//     try {
//       const response = await humidityAPI.getByDevice(selectedDevice, 20);
//       const formattedData = response.data.reverse().map((r) => ({
//         t: new Date(r.timestamp).toLocaleTimeString("es-ES", {
//           hour: "2-digit",
//           minute: "2-digit",
//         }),
//         humidity: parseFloat(r.humidity),
//         raw: r.raw_value,
//         pump: r.pump_active ? 1 : 0,
//       }));
//       setLiveData(formattedData);
//     } catch {}
//   };

//   const handleRefresh = async () => {
//     setRefreshing(true);
//     await loadData();
//     await loadLiveData();
//     setRefreshing(false);
//     toast.success("Datos actualizados");
//   };

//   // ---------- UI ----------
//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 p-6">
//       {/* HEADER */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-4xl font-semibold tracking-tight">Dashboard de Riego</h1>
//           <p className="text-muted-foreground mt-1">Monitoreo del ESP32 y del sistema</p>
//         </div>
//         <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
//           <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
//           Actualizar
//         </Button>
//       </div>

//       {/* --- BLOQUE ESP32 --- */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>🔗 Conexión al ESP32</CardTitle>
//           </CardHeader>
//           <CardContent className="flex flex-col gap-3">
//             <input
//               type="text"
//               placeholder="Ejemplo: 192.168.0.15"
//               value={espIP}
//               onChange={(e) => setEspIP(e.target.value)}
//               className="border p-2 rounded-md w-full"
//             />
//             <Button onClick={probarConexion} disabled={loading} variant="outline">
//               <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
//               {loading ? "Conectando..." : "Probar conexión"}
//             </Button>
//             <p>
//               Estado:{" "}
//               <span className={`font-semibold ${conectado ? "text-green-600" : "text-red-600"}`}>
//                 {conectado ? "Conectado" : "Desconectado"}
//               </span>
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>💧 Estado Actual</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-2">
//             <p>Humedad: {humedad ?? "--"}%</p>
//             <p>Valor RAW: {valorRaw ?? "--"}</p>
//             <p>
//               Bomba:{" "}
//               <span className={bombaActiva ? "text-green-600" : "text-red-600"}>
//                 {bombaActiva ? "Activa" : "Inactiva"}
//               </span>
//             </p>
//             <div className="flex gap-2 mt-3">
//               <Button onClick={() => cambiarBomba("activar")} className="bg-green-600">
//                 Activar
//               </Button>
//               <Button onClick={() => cambiarBomba("desactivar")} className="bg-red-600">
//                 Desactivar
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* --- GRAFICA LOCAL --- */}
//       <Card>
//         <CardHeader>
//           <CardTitle>📈 Historial de Humedad (ESP32)</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {historial.length > 0 ? (
//             <ResponsiveContainer width="100%" height={220}>
//               <AreaChart data={historial.slice(-15)}>
//                 <defs>
//                   <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
//                     <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
//                 <YAxis domain={[0, 100]} />
//                 <Tooltip />
//                 <Area type="monotone" dataKey="humedad" stroke="#22c55e" fill="url(#colorHum)" />
//               </AreaChart>
//             </ResponsiveContainer>
//           ) : (
//             <div className="text-muted-foreground text-center">
//               <Droplets className="h-10 w-10 mx-auto mb-2 opacity-30" />
//               <p>No hay datos aún</p>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* --- BLOQUE BACKEND --- */}
//       {stats && (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//           <Card>
//             <CardContent className="pt-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Dispositivos Online</p>
//                   <p className="text-3xl font-semibold mt-1">
//                     {stats.devices_online} / {stats.devices_total}
//                   </p>
//                 </div>
//                 <Activity className="h-6 w-6 text-primary" />
//               </div>
//               <Badge className="mt-3" variant="secondary">
//                 {stats.devices_online > 0 ? "Activo" : "Inactivo"}
//               </Badge>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardContent className="pt-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Alertas Pendientes</p>
//                   <p className="text-3xl font-semibold mt-1">{stats.alerts_unresolved}</p>
//                 </div>
//                 <AlertTriangle className="h-6 w-6 text-destructive" />
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardContent className="pt-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Registros Hoy</p>
//                   <p className="text-3xl font-semibold mt-1">{stats.records_today}</p>
//                 </div>
//                 <Database className="h-6 w-6 text-primary" />
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardContent className="pt-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Total Dispositivos</p>
//                   <p className="text-3xl font-semibold mt-1">{stats.devices_total}</p>
//                 </div>
//                 <Droplets className="h-6 w-6 text-blue-500" />
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       )}

//       {/* --- GRAFICAS BACKEND --- */}
//       <Card>
//         <CardHeader>
//           <CardTitle>💦 Humedad Promedio en Tiempo Real (Backend)</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {liveData.length > 0 ? (
//             <ResponsiveContainer width="100%" height={250}>
//               <LineChart data={liveData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="t" />
//                 <YAxis />
//                 <Tooltip />
//                 <Line type="monotone" dataKey="humidity" stroke="#2563eb" strokeWidth={2} />
//               </LineChart>
//             </ResponsiveContainer>
//           ) : (
//             <p className="text-center text-muted-foreground">Sin datos en vivo</p>
//           )}
//         </CardContent>
//       </Card>
//     </motion.div>
//   );
// }



import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Droplets, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// ---- BASE LOCAL ----
const LocalDB = {
  obtenerRegistros: () =>
    JSON.parse(localStorage.getItem("historial_humedad") || "[]"),
  guardarRegistro: (data) => {
    const registros = JSON.parse(localStorage.getItem("historial_humedad") || "[]");
    registros.push({ ...data, fecha: new Date().toLocaleTimeString() });
    if (registros.length > 30) registros.shift();
    localStorage.setItem("historial_humedad", JSON.stringify(registros));
  },
};

export default function DashboardRiego() {
  const [espIP, setEspIP] = useState(localStorage.getItem("espIP") || "http://192.168.1.2");
  const [conectado, setConectado] = useState(false);
  const [humedad, setHumedad] = useState(0);
  const [valorRaw, setValorRaw] = useState(0);
  const [bombaActiva, setBombaActiva] = useState(false);
  const [historial, setHistorial] = useState(LocalDB.obtenerRegistros());
  const intervaloRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Guardar IP localmente
  useEffect(() => {
    localStorage.setItem("espIP", espIP);
  }, [espIP]);

  // --- Obtener datos del ESP ---
  const obtenerDatosHumedad = async () => {
    if (!espIP) return;

    try {
      const url = espIP.startsWith("http") ? espIP : `http://${espIP}`;
      const res = await fetch(`${url}/humedad`);
      const data = await res.json();

      if (data.status === "ok") {
        setConectado(true);
        setHumedad(data.humedad);
        setValorRaw(data.valorRaw);
        setBombaActiva(data.bombaActiva);

        LocalDB.guardarRegistro({
          humedad: data.humedad,
          valorRaw: data.valorRaw,
          bombaActiva: data.bombaActiva,
        });

        setHistorial(LocalDB.obtenerRegistros());
      } else {
        setConectado(false);
      }
    } catch (error) {
      console.error("❌ Error leyendo del ESP32:", error);
      setConectado(false);
    }
  };

  // --- Iniciar monitoreo en tiempo real ---
  const iniciarMonitoreo = () => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    obtenerDatosHumedad();
    intervaloRef.current = setInterval(obtenerDatosHumedad, 5000);
    toast.success("📡 Monitoreo iniciado");
  };

  // --- Probar conexión ---
  const probarConexion = async () => {
    setLoading(true);
    try {
      const url = espIP.startsWith("http") ? espIP : `http://${espIP}`;
      const res = await fetch(`${url}/diagnostico`);
      const data = await res.text();

      if (data.includes("OK") || data.includes("ok")) {
        setConectado(true);
        toast.success("✅ ESP32 conectado correctamente");
        iniciarMonitoreo();
      } else {
        toast.error("❌ El ESP32 no respondió correctamente");
      }
    } catch (err) {
      toast.error("⚠️ No se pudo conectar al ESP32");
      setConectado(false);
    } finally {
      setLoading(false);
    }
  };

  // --- Control manual de la bomba ---
  const cambiarBomba = async (accion) => {
    if (!espIP) return toast.error("IP no definida");
    try {
      const url = espIP.startsWith("http") ? espIP : `http://${espIP}`;
      const res = await fetch(`${url}/manual?accion=${accion}`);
      if (res.ok) {
        toast.success(
          accion === "activar" ? "💧 Bomba activada" : "⏹️ Bomba desactivada"
        );
        obtenerDatosHumedad();
      } else {
        toast.error("Error cambiando estado de la bomba");
      }
    } catch (err) {
      toast.error("Error enviando comando al ESP32");
    }
  };

  // --- Limpieza al desmontar ---
  useEffect(() => {
    return () => clearInterval(intervaloRef.current);
  }, []);

  // --- UI ---
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🌿 Dashboard de Riego</h1>
        <Button onClick={probarConexion} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Conectando..." : "Probar conexión"}
        </Button>
      </div>

      {/* --- ESTADO --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conexión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">
              Estado:{" "}
              <span className={conectado ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                {conectado ? "Conectado" : "Desconectado"}
              </span>
            </p>
            <input
              type="text"
              value={espIP}
              onChange={(e) => setEspIP(e.target.value)}
              placeholder="Ej: http://192.168.1.2"
              className="border p-2 rounded w-full"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Humedad</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{humedad}%</p>
            <p className="text-muted-foreground">Raw: {valorRaw}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bomba</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${bombaActiva ? "text-green-600" : "text-red-600"}`}>
              {bombaActiva ? "Activa" : "Inactiva"}
            </p>
            <div className="flex gap-2 mt-3">
              <Button onClick={() => cambiarBomba("activar")} className="bg-green-600">
                Activar
              </Button>
              <Button onClick={() => cambiarBomba("desactivar")} className="bg-red-600">
                Desactivar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- GRAFICO --- */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Historial de humedad</CardTitle>
        </CardHeader>
        <CardContent>
          {historial.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={historial}>
                <defs>
                  <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="humedad" stroke="#2563eb" fill="url(#colorHum)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground">
              <Droplets className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Esperando datos del sensor...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
