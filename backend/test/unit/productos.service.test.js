import assert from "node:assert/strict";
import { test } from "node:test";
import { ProductosService } from "../../src/services/productos.service.js";

test("el servicio no llama al almacenamiento cuando el precio es inválido", () => {
  let escrituras = 0;
  const servicio = new ProductosService({ crear: () => { escrituras++; } });
  assert.throws(() => servicio.crear({ nombre: "Bocina", precio: -1, categoria: "Audio" }), { status: 400 });
  assert.equal(escrituras, 0);
});

test("el servicio limpia espacios y omite campos elegidos por el cliente", async () => {
  let recibido;
  const servicio = new ProductosService({ crear: async datos => { recibido = datos; return { id: "interno", ...datos }; } });
  const resultado = await servicio.crear({ nombre: " Bocina ", precio: 150, categoria: " Audio ", id: "externo", nombreNormalizado: "otro" });
  assert.deepEqual(recibido, { nombre: "Bocina", precio: 150, categoria: "Audio" });
  assert.equal(resultado.id, "interno");
});
