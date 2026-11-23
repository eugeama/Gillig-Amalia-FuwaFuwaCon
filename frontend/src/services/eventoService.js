import { enviar, request } from "./api";

export function getEventos() {
  return request("/api/eventos");
}

export function getStands(eventoId, fecha) {
  const query = fecha ? `?fecha=${encodeURIComponent(fecha)}` : "";
  return request(`/api/eventos/${eventoId}/stands${query}`);
}

export function getConcursos(eventoId, fecha) {
  const query = fecha ? `?fecha=${encodeURIComponent(fecha)}` : "";
  return request(`/api/eventos/${eventoId}/concursos${query}`);
}

export function createEvento(datos) {
  return enviar("/api/admin/eventos", datos);
}

export function updateEvento(id, datos) {
  return enviar(`/api/admin/eventos/${id}`, datos, "PUT");
}

export function createConcurso(eventoId, datos) {
  return enviar(`/api/admin/eventos/${eventoId}/concursos`, datos);
}

export function deleteEvento(id) {
  return request(`/api/admin/eventos/${id}`, { method: "DELETE" });
}

export function deleteConcurso(id) {
  return request(`/api/admin/concursos/${id}`, { method: "DELETE" });
}
