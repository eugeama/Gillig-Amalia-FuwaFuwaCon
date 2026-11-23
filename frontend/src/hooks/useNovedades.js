import { useCallback, useEffect, useState } from "react";
import { getNovedades } from "../services/novedadService";
import { useNotificaciones } from "../utils/notificaciones";

function useNovedades() {
  const [novedades, setNovedades] = useState([]);
  const { error } = useNotificaciones();

  const cargar = useCallback(async () => {
    try {
      setNovedades(await getNovedades());
    } catch (err) {
      error(err.message);
    }
  }, [error]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { novedades, recargar: cargar };
}

export default useNovedades;
