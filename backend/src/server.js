import { crearApp } from "./app.js";

const puerto = Number(process.env.PORT ?? 3001);
const app = crearApp();

const servidor = app.listen(puerto, "127.0.0.1", () => {
  console.log(`Satoru Store API: http://127.0.0.1:${puerto}/api/productos`);
});

servidor.on("error", (error) => {
  console.error(`No se pudo iniciar la API: ${error.message}`);
  process.exitCode = 1;
});