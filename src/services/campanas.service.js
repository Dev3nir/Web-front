// src/services/campanas.service.js
import { apiFetch } from "../utils/api.js";

const BASE = "/campanas";

/**
 * GET /campanas → lista de campañas
 * (GET público según el mapa de permisos; apiFetch igual manda el token si existe)
 * @returns {Promise<Array>}
 */
export function listarCampanas() {
  return apiFetch(BASE);
}

/**
 * GET /campanas/:id → una campaña
 * @param {number|string} id
 */
export function obtenerCampana(id) {
  return apiFetch(`${BASE}/${id}`);
}

/**
 * POST /campanas → crear campaña (responsable, administrador)
 * @param {{nombre:string, descripcion?:string|null, fecha_inicio?:string|null,
 *          fecha_fin?:string|null, ubicacion?:string|null, estado?:string}} data
 */
export function crearCampana(data) {
  return apiFetch(BASE, { method: "POST", body: JSON.stringify(data) });
}

/**
 * PUT /campanas/:id → actualizar campaña (responsable, administrador)
 */
export function actualizarCampana(id, data) {
  return apiFetch(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

/**
 * DELETE /campanas/:id → borrado (solo administrador)
 */
export function eliminarCampana(id) {
  return apiFetch(`${BASE}/${id}`, { method: "DELETE" });
}
