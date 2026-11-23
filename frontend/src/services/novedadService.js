import { enviar, request } from "./api";

export function getNovedades() {
  return request("/api/novedades");
}

export function createNovedad(datos) {
  return enviar("/api/admin/novedades", datos);
}

export function deleteNovedad(id) {
  return request(`/api/admin/novedades/${id}`, { method: "DELETE" });
}
