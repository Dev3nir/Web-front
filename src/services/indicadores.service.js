// src/services/indicadores.service.js
import { apiFetch } from "../utils/api.js";

const BASE = "/indicadores";

/** GET /indicadores → resumen general */
export const obtenerResumen = () => apiFetch(BASE);

/** GET /indicadores/campanas → resultados por campaña */
export const obtenerIndicadoresCampanas = () => apiFetch(`${BASE}/campanas`);

/** GET /indicadores/reutilizacion → reparación, reutilización, gestores */
export const obtenerIndicadoresReutilizacion = () => apiFetch(`${BASE}/reutilizacion`);
