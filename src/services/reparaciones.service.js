import { apiFetch } from "../utils/api.js";

const BASE = "/reparaciones";

/**
 * GET /reparaciones → lista de reparaciones
 * @returns {Promise<Array>}
 */
export function listarReparaciones() {
    return apiFetch(BASE);
}

/**
 * GET /reparaciones/:id → una reparación
 * @param {number|string} id
 */
export function obtenerReparacion(id) {
    return apiFetch(`${BASE}/${id}`);
}

/**
 * POST /reparaciones → crear reparación
 * @param {{
 *   equipo_id: number,
 *   diagnostico_id?: number | null,
 *   descripcion: string,
 *   costo: number,
 *   ahorro_estimado: number,
 *   fecha: string,
 *   responsable_id?: number
 * }} data
 */
export function crearReparacion(data) {
    return apiFetch(BASE, { method: "POST", body: JSON.stringify(data) });
}

/**
 * PUT /reparaciones/:id → actualizar reparación
 * @param {number|string} id
 * @param {Object} data
 */
export function actualizarReparacion(id, data) {
    return apiFetch(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

/**
 * DELETE /reparaciones/:id → eliminar reparación (solo administrador)
 * @param {number|string} id
 */
export function eliminarReparacion(id) {
    return apiFetch(`${BASE}/${id}`, { method: "DELETE" });
}