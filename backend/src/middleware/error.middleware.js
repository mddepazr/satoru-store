import { MongoNetworkError, MongoServerSelectionError, MongoOperationTimeoutError } from "mongodb";

// Express reconoce este middleware de errores por sus cuatro parámetros.
export function manejarError(error, req, res, next) {
  // Si la respuesta ya comenzó, delega el error para evitar responder dos veces.
  if (res.headersSent) {
    return next(error);
  }

  // También captura errores producidos antes del controlador, al leer el cuerpo.
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      mensaje: "El cuerpo de la solicitud contiene JSON inválido.",
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      mensaje: "La solicitud supera el tamaño permitido.",
    });
  }

  // Solo expone errores de validación controlados.
  if (error.status === 400) {
    return res.status(400).json({
      mensaje: error.message,
      errores: error.errores ?? {},
    });
  }

  // Si MongoDB deja de responder, informa una falla temporal sin revelar la conexión.
  if (
    error instanceof MongoNetworkError ||
    error instanceof MongoServerSelectionError ||
    error instanceof MongoOperationTimeoutError
  ) {
    return res.status(503).json({
      mensaje: "La base de datos no está disponible. Intenta nuevamente.",
    });
  }

  // Registra solo el tipo; los detalles podrían contener información de conexión.
  console.error(`Error interno: ${error.name ?? "Error"}`);

  return res.status(500).json({
    mensaje: "Ocurrió un error en el servidor. Intenta nuevamente.",
  });
}