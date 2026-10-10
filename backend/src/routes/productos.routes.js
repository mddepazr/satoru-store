import { Router } from "express";

export function crearProductosRouter(controller) {
  const router = Router();

  router.get("/", controller.listar);

  router.post("/", (req, res, next) => {
    if (!req.is("application/json")) {
      return res.status(415).json({
        mensaje: "Envía los datos con Content-Type application/json.",
      });
    }

    next();
  }, controller.crear);

  return router;
}