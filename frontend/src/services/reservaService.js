import { enviar, request } from "./api";

export function getMisReservas() {
  return request("/api/reservas/mias");
}

export function solicitarReserva(datos) {
  return enviar("/api/reservas", datos);
}

export function eliminarMiReserva(id) {
  return request(`/api/reservas/${id}`, { method: "DELETE" });
}

export function getReservasAdministrador() {
  return request("/api/admin/reservas");
}

export function resolverReserva(id, estado) {
  return enviar(`/api/admin/reservas/${id}`, { estado }, "PATCH");
}

export function eliminarReservaAdministrador(id) {
  return request(`/api/admin/reservas/${id}`, { method: "DELETE" });
}
