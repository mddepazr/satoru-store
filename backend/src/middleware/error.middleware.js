export function manejarError(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

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

  console.error(error);

  return res.status(500).json({
    mensaje: "Ocurrió un error en el servidor. Intenta nuevamente.",
  });
}