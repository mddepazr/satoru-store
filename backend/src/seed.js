import { prepararColeccionProductos } from "./config/productos.collection.js";
import { conectarBaseDeDatos } from "./config/database.js";
import { cargarProductosIniciales } from "./data/productos-iniciales.js";

let conexion;
try {
  conexion = await conectarBaseDeDatos();
  await prepararColeccionProductos(conexion.db.collection("productos"));
  await cargarProductosIniciales(conexion.db.collection("productos"));
  console.log("Productos de ejemplo disponibles. Los registros existentes se conservaron.");
} catch (error) {
  console.error(error.name === "PreparacionProductosError" ? error.message : "No se pudieron cargar los ejemplos. Revisa MongoDB y la configuración.");
  process.exitCode = 1;
} finally {
  await conexion?.cliente.close();
}
