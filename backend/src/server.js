import { prepararColeccionProductos } from "./config/productos.collection.js";
import { crearApp } from "./app.js";
import { conectarBaseDeDatos } from "./config/database.js";
import { ProductosRepository } from "./repositories/productos.repository.js";

const puerto = Number(process.env.PORT ?? 3001);
let conexion;

try {
  // Sin MongoDB no se inicia la API: evita aparentar que los datos se guardan.
  conexion = await conectarBaseDeDatos();
  const coleccion = conexion.db.collection("productos");
  await prepararColeccionProductos(coleccion);
  const repository = new ProductosRepository(coleccion);
  const app = crearApp(repository);

  const servidor = app.listen(puerto, "127.0.0.1", () => {
    console.log(`MongoDB conectado: ${conexion.db.databaseName} / productos`);
    console.log(`Satoru Store API: http://127.0.0.1:${puerto}/api/productos`);
  });

  servidor.on("error", async (error) => {
    console.error(`No se pudo iniciar la API (${error.code ?? "error"}).`);
    await conexion.cliente.close();
    process.exitCode = 1;
  });

  let cerrando = false;
  function cerrar() {
    if (cerrando) return;
    cerrando = true;
    // Ctrl+C deja terminar las solicitudes y después cierra MongoDB.
    servidor.close(async () => {
      await conexion.cliente.close();
    });
  }
  process.once("SIGINT", cerrar);
  process.once("SIGTERM", cerrar);
} catch (error) {
  await conexion?.cliente.close();
  // No imprime la cadena de conexión, que podría contener credenciales.
  console.error(error.name === "PreparacionProductosError"
    ? error.message
    : "No se pudo iniciar la API. Revisa MongoDB, MONGODB_URI, MONGODB_DB y PORT.");
  process.exitCode = 1;
}
