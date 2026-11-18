import { useEffect, useRef } from "react";
import Boton from "./Boton";

function DialogoConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  textoProcesando,
  procesando,
  onConfirmar,
  onCancelar,
}) {
  const dialogo = useRef(null);

  useEffect(() => {
    const elemento = dialogo.current;

    if (abierto && !elemento.open) {
      elemento.showModal();
    } else if (!abierto && elemento.open) {
      elemento.close();
    }
  }, [abierto]);

  return (
    <dialog ref={dialogo} className="dialogo" aria-labelledby="dialogo-titulo" onCancel={onCancelar}>
      <h2 id="dialogo-titulo" className="dialogo__titulo">
        {titulo}
      </h2>
      <p>{mensaje}</p>
      <div className="dialogo__acciones">
        <Boton variante="secundario" onClick={onCancelar} disabled={procesando}>
          Cancelar
        </Boton>
        <Boton variante="peligro" onClick={onConfirmar} disabled={procesando}>
          {procesando ? textoProcesando : textoConfirmar}
        </Boton>
      </div>
    </dialog>
  );
}

export default DialogoConfirmacion;
