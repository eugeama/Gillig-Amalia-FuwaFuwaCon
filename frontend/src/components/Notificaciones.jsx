import { useCallback, useMemo, useState } from "react";
import { NotificacionesContext } from "../utils/notificaciones";

const DURACION_MS = 5000;

function Notificaciones({ children }) {
  const [items, setItems] = useState([]);

  const cerrar = useCallback((id) => {
    setItems((actuales) => actuales.filter((item) => item.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo, mensaje) => {
      const id = crypto.randomUUID();
      setItems((actuales) => [...actuales, { id, tipo, mensaje }]);
      setTimeout(() => cerrar(id), DURACION_MS);
    },
    [cerrar]
  );

  const valor = useMemo(
    () => ({
      exito: (mensaje) => mostrar("exito", mensaje),
      error: (mensaje) => mostrar("error", mensaje),
    }),
    [mostrar]
  );

  return (
    <NotificacionesContext.Provider value={valor}>
      {children}
      <div className="notificaciones">
        {items.map((item) => (
          <div
            key={item.id}
            className={`notificacion notificacion--${item.tipo}`}
            role={item.tipo === "error" ? "alert" : "status"}
          >
            <p>{item.mensaje}</p>
            <button
              type="button"
              className="notificacion__cerrar"
              onClick={() => cerrar(item.id)}
              aria-label="Cerrar notificación"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificacionesContext.Provider>
  );
}

export default Notificaciones;
