import { Router } from "express";

export function crearProductosRouter(controller) {
  const router = Router();

  // Al montarse en app.js, estas rutas son GET y POST /api/productos.
  router.get("/", controller.listar);

  router.post("/", (req, res, next) => {
    // 415 rechaza cuerpos cuyo tipo de contenido no sea JSON.
    if (!req.is("application/json")) {
      return res.status(415).json({
        mensaje: "Envía los datos con Content-Type application/json.",
      });
    }

    // Continúa con controller.crear solo si el formato de la petición es correcto.
    next();
  }, controller.crear);

  return router;
}