import { enviar, request } from "./api";

export function obtenerUsuarioActual() {
  return request("/api/auth/me");
}

export function registrarUsuario(datos) {
  return enviar("/api/auth/registro", datos);
}

export function iniciarSesion(datos) {
  return enviar("/api/auth/login", datos);
}

export function cerrarSesion() {
  return enviar("/api/auth/logout", {});
}
