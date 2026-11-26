// src/services/gestores.service.js
import { apiFetch } from "../utils/api.js";

const BASE = "/gestores";

/** GET /gestores?activo=&verificado=&q= */
export function listarGestores(filtros = {}) {
  const qs = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return apiFetch(qs ? `${BASE}?${qs}` : BASE);
}

export const obtenerGestor = (id) => apiFetch(`${BASE}/${id}`);

export const crearGestor = (data) =>
  apiFetch(BASE, { method: "POST", body: JSON.stringify(data) });

export const actualizarGestor = (id, data) =>
  apiFetch(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const desactivarGestor = (id) =>
  apiFetch(`${BASE}/${id}/desactivar`, { method: "PUT" });

export const eliminarGestor = (id) =>
  apiFetch(`${BASE}/${id}`, { method: "DELETE" });
