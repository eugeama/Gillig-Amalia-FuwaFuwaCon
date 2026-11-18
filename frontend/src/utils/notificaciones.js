import { createContext, useContext } from "react";

export const NotificacionesContext = createContext(null);

export function useNotificaciones() {
  const contexto = useContext(NotificacionesContext);

  if (!contexto) {
    throw new Error("useNotificaciones debe usarse dentro de Notificaciones");
  }

  return contexto;
}
