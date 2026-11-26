import { apiFetch } from "../utils/api.js";

const BASE = "/diagnosticos";

/**
 * GET /diagnosticos → lista de diagnósticos
 * @returns {Promise<Array>}
 */
export function listarDiagnosticos() {
    return apiFetch(BASE);
}

/**
 * GET /diagnosticos/:id → un diagnóstico
 * @param {number|string} id
 */
export function obtenerDiagnostico(id) {
    return apiFetch(`${BASE}/${id}`);
}

/**
 * POST /diagnosticos → crear diagnóstico
 * @param {{
 *   equipo_id: number,
 *   diagnostico: string,
 *   recomendacion: "reparar" | "reutilizar" | "conservar" | "gestion_especializada",
 *   fecha?: string,
 *   responsable_id?: number
 * }} data
 */
export function crearDiagnostico(data) {
    return apiFetch(BASE, { method: "POST", body: JSON.stringify(data) });
}

/**
 * PUT /diagnosticos/:id → actualizar diagnóstico
 * @param {number|string} id
 * @param {Object} data
 */
export function actualizarDiagnostico(id, data) {
    return apiFetch(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

/**
 * DELETE /diagnosticos/:id → eliminar diagnóstico (solo administrador)
 * @param {number|string} id
 */
export function eliminarDiagnostico(id) {
    return apiFetch(`${BASE}/${id}`, { method: "DELETE" });
}