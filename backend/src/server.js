import { crearApp } from "./app.js";

// Usa PORT si está configurado; de lo contrario, escucha en el puerto 3001.
const puerto = Number(process.env.PORT ?? 3001);
const app = crearApp();

// Abre el servidor solo en esta computadora, como requiere la demostración local.
const servidor = app.listen(puerto, "127.0.0.1", () => {
  console.log(`Satoru Store API: http://127.0.0.1:${puerto}/api/productos`);
});

// Informa problemas al iniciar, por ejemplo un puerto ocupado.
servidor.on("error", (error) => {
  console.error(`No se pudo iniciar la API: ${error.message}`);
  process.exitCode = 1;
});