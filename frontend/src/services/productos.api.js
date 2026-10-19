// Conserva el mensaje general y los errores por campo recibidos de la API.
export class ApiError extends Error {
  constructor(mensaje, errores = {}) {
    super(mensaje);
    this.name = "ApiError";
    this.errores = errores;
  }
}

// Centraliza la conexión para que los componentes no repitan fetch ni manejo HTTP.
async function solicitar(opciones = {}, signal) {
  let respuesta;

  try {
    // Evita dejar la interfaz esperando indefinidamente.
    const timeout = AbortSignal.timeout(8000);
    // La petición termina por tiempo agotado o por cancelación del componente.
    const combinedSignal = signal
      ? AbortSignal.any([signal, timeout])
      : timeout;

    respuesta = await fetch("/api/productos", {
      ...opciones,
      signal: combinedSignal,
    });
  } catch (error) {
    // Una cancelación intencional no debe convertirse en un aviso de conexión.
    if (signal?.aborted) throw error;

    throw new ApiError(
      "No se pudo conectar con el catálogo. Intenta nuevamente."
    );
  }

  // Leer JSON también puede fallar; null permite mostrar un mensaje controlado.
  const contenido = await respuesta.json().catch(() => null);

  // fetch no lanza errores por códigos 400 o 500: hay que comprobar respuesta.ok.
  if (!respuesta.ok) {
    throw new ApiError(
      contenido?.mensaje ?? "El catálogo no está disponible. Intenta nuevamente.",
      contenido?.errores ?? {}
    );
  }

  // GET devuelve un arreglo; POST conserva su objeto con mensaje y datos.
  return contenido;
}

export async function listarProductos(signal) {
  // Sin opciones, fetch usa GET. La señal permite cancelar la carga.
  const productos = await solicitar({}, signal);

  if (!Array.isArray(productos)) {
    throw new ApiError("No se pudo interpretar la lista de productos.");
  }

  return productos;
}

// POST envía el producto como texto JSON y declara ese formato en la cabecera.
export async function crearProducto(producto) {
  const contenido = await solicitar({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });
  if (!contenido?.datos || typeof contenido.datos.id !== "string") {
    throw new ApiError("El servidor devolvió una respuesta inesperada.");
  }
  return contenido.datos;
}