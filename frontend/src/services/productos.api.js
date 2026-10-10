export class ApiError extends Error {
  constructor(mensaje, errores = {}) {
    super(mensaje);
    this.name = "ApiError";
    this.errores = errores;
  }
}

async function solicitar(opciones = {}, signal) {
  let respuesta;

  try {
    // Evita dejar la interfaz esperando indefinidamente.
    const timeout = AbortSignal.timeout(8000);
    const combinedSignal = signal
      ? AbortSignal.any([signal, timeout])
      : timeout;

    respuesta = await fetch("/api/productos", {
      ...opciones,
      signal: combinedSignal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;

    throw new ApiError(
      "No se pudo conectar con el catálogo. Intenta nuevamente."
    );
  }

  const contenido = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ApiError(
      contenido?.mensaje ?? "El catálogo no está disponible. Intenta nuevamente.",
      contenido?.errores ?? {}
    );
  }

  if (!contenido || !("datos" in contenido)) {
    throw new ApiError("El servidor devolvió una respuesta inesperada.");
  }

  return contenido.datos;
}

export async function listarProductos(signal) {
  const productos = await solicitar({}, signal);

  if (!Array.isArray(productos)) {
    throw new ApiError("No se pudo interpretar la lista de productos.");
  }

  return productos;
}

export function crearProducto(producto) {
  return solicitar({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });
}