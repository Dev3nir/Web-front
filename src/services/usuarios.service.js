// src/services/usuarios.service.js
import { apiFetch } from "../utils/api.js";

const BASE = "/usuarios";

/**
 * GET /usuarios → lista de usuarios
 * @returns {Promise<Array>}
 */
export function listarUsuarios() {
  return apiFetch(BASE);
}

/**
 * GET /usuarios/:id → un usuario
 * @param {number|string} id
 */
export function obtenerUsuario(id) {
  return apiFetch(`${BASE}/${id}`);
}

/**
 * POST /usuarios → crear usuario
 * @param {{nombre_usuario:string, nombre_completo:string, correo?:string|null, password:string, rol?:string}} data
 */
export function crearUsuario(data) {
  return apiFetch(BASE, { method: "POST", body: JSON.stringify(data) });
}

/**
 * PUT /usuarios/:id → actualizar (nombre_completo, correo, rol, activo)
 */
export function actualizarUsuario(id, data) {
  return apiFetch(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

/**
 * PUT /usuarios/:id/password → cambiar contraseña
 * @param {{password:string}} data
 */
export function cambiarPasswordUsuario(id, data) {
  return apiFetch(`${BASE}/${id}/password`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * PUT /usuarios/:id/desactivar → soft delete (activo = 0)
 */
export function desactivarUsuario(id) {
  return apiFetch(`${BASE}/${id}/desactivar`, { method: "PUT" });
}

/**
 * DELETE /usuarios/:id → borrado físico
 */
export function eliminarUsuario(id) {
  return apiFetch(`${BASE}/${id}`, { method: "DELETE" });
}