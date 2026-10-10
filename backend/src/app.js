import express from "express";
import { ProductosRepository } from "./repositories/productos.repository.js";
import { ProductosService } from "./services/productos.service.js";
import { crearProductosController } from "./controllers/productos.controller.js";
import { crearProductosRouter } from "./routes/productos.routes.js";
import { manejarError } from "./middleware/error.middleware.js";

export function crearApp(repository = new ProductosRepository()) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  // Inyecta el almacenamiento en el servicio.
  const service = new ProductosService(repository);
  const controller = crearProductosController(service);

  app.use("/api/productos", crearProductosRouter(controller));

  app.use((req, res) => {
    res.status(404).json({ mensaje: "La ruta solicitada no existe." });
  });

  // Se registra al final para recibir los errores de las rutas.
  app.use(manejarError);

  return app;
}