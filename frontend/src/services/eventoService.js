import { enviar, request } from "./api";

export function getEventos() {
  return request("/api/eventos");
}

export function getStands(eventoId) {
  return request(`/api/eventos/${eventoId}/stands`);
}

export function getConcursos(eventoId) {
  return request(`/api/eventos/${eventoId}/concursos`);
}

export function createEvento(datos) {
  return enviar("/api/admin/eventos", datos);
}

export function updateEvento(id, datos) {
  return enviar(`/api/admin/eventos/${id}`, datos, "PUT");
}

export function createStand(eventoId, datos) {
  return enviar(`/api/admin/eventos/${eventoId}/stands`, datos);
}

export function createConcurso(eventoId, datos) {
  return enviar(`/api/admin/eventos/${eventoId}/concursos`, datos);
}
