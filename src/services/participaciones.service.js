// src/services/participaciones.service.js
import { apiFetch } from "../utils/api.js";

const BASE = "/participaciones";

/**
 * GET /participaciones → lista de participaciones
 * (responsable, administrador según el mapa de permisos)
 * @returns {Promise<Array>}
 */
export function listarParticipaciones() {
  return apiFetch(BASE);
}

/**
 * GET /participaciones/:id → una participación
 * @param {number|string} id
 */
export function obtenerParticipacion(id) {
  return apiFetch(`${BASE}/${id}`);
}

/**
 * POST /participaciones → registrar participación (capturista, responsable, administrador)
 * @param {{campana_id:number, nombre_participante:string, correo?:string|null,
 *          telefono?:string|null, tipo_residuo?:string|null, peso_kg?:number,
 *          observaciones?:string|null}} data
 */
export function crearParticipacion(data) {
  return apiFetch(BASE, { method: "POST", body: JSON.stringify(data) });
}

/**
 * PUT /participaciones/:id → actualizar (capturista, responsable, administrador)
 */
export function actualizarParticipacion(id, data) {
  return apiFetch(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

/**
 * DELETE /participaciones/:id → borrado (solo administrador)
 */
export function eliminarParticipacion(id) {
  return apiFetch(`${BASE}/${id}`, { method: "DELETE" });
}
