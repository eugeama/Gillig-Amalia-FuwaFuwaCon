import { enviar, request } from "./api";

export function getMisInscripciones() {
  return request("/api/concursos/inscripciones/mias");
}

export function inscribirEnConcurso(id, fecha) {
  return enviar(`/api/concursos/${id}/inscripciones`, { fecha });
}

export function cancelarInscripcion(id) {
  return request(`/api/concursos/inscripciones/${id}`, { method: "DELETE" });
}

export function getInscripcionesAdministrador() {
  return request("/api/admin/inscripciones");
}

export function eliminarInscripcionAdministrador(id) {
  return request(`/api/admin/inscripciones/${id}`, { method: "DELETE" });
}
