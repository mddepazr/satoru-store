import express from "express";
import { ProductosRepository } from "./repositories/productos.repository.js";
import { ProductosService } from "./services/productos.service.js";
import { crearProductosController } from "./controllers/productos.controller.js";
import { crearProductosRouter } from "./routes/productos.routes.js";
import { manejarError } from "./middleware/error.middleware.js";

// Construye la API sin abrir el puerto; permite usarla también en pruebas.
// Puede recibir otro repositorio que implemente listar() y crear().
export function crearApp(repository = new ProductosRepository()) {
  const app = express();

  // Omite la cabecera que identifica Express; no reemplaza otras medidas de seguridad.
  app.disable("x-powered-by");
  // Convierte el cuerpo JSON en req.body y limita su tamaño a 10 KB.
  app.use(express.json({ limit: "10kb" }));

  // Inyecta el almacenamiento en el servicio.
  const service = new ProductosService(repository);
  const controller = crearProductosController(service);

  // Todas las rutas del router empiezan con este prefijo.
  app.use("/api/productos", crearProductosRouter(controller));

  // Si ninguna ruta respondió, devuelve un 404 en el mismo formato JSON.
  app.use((req, res) => {
    res.status(404).json({ mensaje: "La ruta solicitada no existe." });
  });

  // Se registra al final para recibir los errores de las rutas.
  app.use(manejarError);

  return app;
}