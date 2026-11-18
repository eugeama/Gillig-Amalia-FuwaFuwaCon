import { request } from "./api";

const API_URL = "/api/admin/usuarios";

export function getUsuarios() {
  return request(API_URL);
}

export function asignarAdministrador(id) {
  return request(`${API_URL}/${id}/administrador`, { method: "PATCH" });
}
