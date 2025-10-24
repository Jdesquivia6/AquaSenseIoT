// src/utils/localDB.js
export const LocalDB = {
  guardarRegistro: (datos) => {
    let registros = JSON.parse(localStorage.getItem("registrosRiego") || "[]");
    registros.unshift({
      timestamp: new Date().toISOString(),
      humedad: datos.humedad,
      bombaActiva: datos.bombaActiva,
      valorRaw: datos.valorRaw,
      fecha: new Date().toLocaleString(),
    });

    if (registros.length > 100) registros = registros.slice(0, 100);
    localStorage.setItem("registrosRiego", JSON.stringify(registros));
  },

  obtenerRegistros: () => JSON.parse(localStorage.getItem("registrosRiego") || "[]"),

  limpiarRegistros: () => localStorage.removeItem("registrosRiego"),
};
