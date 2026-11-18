import { useCallback, useEffect, useState } from "react";
import { getEventos } from "../services/eventoService";
import { useNotificaciones } from "../utils/notificaciones";

function useEventos() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { error } = useNotificaciones();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setEventos(await getEventos());
    } catch (err) {
      error(err.message);
    } finally {
      setCargando(false);
    }
  }, [error]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { eventos, cargando, recargar: cargar };
}

export default useEventos;
