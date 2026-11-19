// src/utils/api.js
import API_URL from "../config/backend.js";

/**
 * Cliente HTTP central. Uso:
 *   apiFetch("/usuarios")
 *   apiFetch("/usuarios/1")
 *   apiFetch("/usuarios", { method: "POST", body: JSON.stringify(data) })
 *
 * - Agrega Authorization: Bearer <token> automáticamente si existe.
 * - Content-Type: application/json por default.
 * - En 401 limpia la sesión y redirige a /login.
 * - En errores 4xx/5xx lanza un Error con el `message` del back.
 * - Devuelve el JSON parseado, o null si 204.
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // Token expirado o inválido
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = "/login";
    return null;
  }

  // Sin contenido
  if (res.status === 204) return null;

  // Errores del back
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }

  // Respuesta exitosa con body
  return res.json();
}