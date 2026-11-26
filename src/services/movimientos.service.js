// src/services/movimientos.service.js
import { apiFetch } from "../utils/api.js";

const BASE = "/movimientos";

/** GET /movimientos?equipo_id=&tipo=&desde=&hasta= */
export function listarMovimientos(filtros = {}) {
  const qs = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return apiFetch(qs ? `${BASE}?${qs}` : BASE);
}

/** GET /movimientos/tipos → [{ tipo, etiqueta }] */
export const tiposMovimiento = () => apiFetch(`${BASE}/tipos`);

/** GET /movimientos/equipo/:id → historial del equipo */
export const historialEquipo = (idEquipo) => apiFetch(`${BASE}/equipo/${idEquipo}`);

export const obtenerMovimiento = (id) => apiFetch(`${BASE}/${id}`);

export const crearMovimiento = (data) =>
  apiFetch(BASE, { method: "POST", body: JSON.stringify(data) });

export const actualizarMovimiento = (id, data) =>
  apiFetch(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const eliminarMovimiento = (id) =>
  apiFetch(`${BASE}/${id}`, { method: "DELETE" });