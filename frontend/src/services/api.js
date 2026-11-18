export async function request(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(body?.message || "Ocurrió un error inesperado");
    error.status = response.status;
    throw error;
  }

  return body.data;
}

export function enviar(url, datos, method = "POST") {
  return request(url, { method, body: JSON.stringify(datos) });
}
