import { enviar, request } from "./api";

export function getMisInscripciones() {
  return request("/api/concursos/inscripciones/mias");
}

export function inscribirEnConcurso(id) {
  return enviar(`/api/concursos/${id}/inscripciones`, {});
}
