import assert from "node:assert/strict";
import { test } from "node:test";
import { listarProductos, crearProducto, ApiError } from "../src/services/productos.api.js";

// Simula HTTP para comprobar el contrato sin iniciar React ni una base de datos.
test("listarProductos consume el arreglo directo de GET", async t => {
  const productos = [{ id: "p1", nombre: "Bocina", precio: 150, categoria: "Audio" }];
  t.mock.method(globalThis, "fetch", async () => Response.json(productos));
  assert.deepEqual(await listarProductos(), productos);
});

test("crearProducto envía JSON y devuelve datos del POST", async t => {
  const producto = { nombre: "Bocina", precio: 150, categoria: "Audio" };
  t.mock.method(globalThis, "fetch", async (ruta, opciones) => {
    assert.equal(ruta, "/api/productos");
    assert.equal(opciones.method, "POST");
    assert.equal(opciones.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(opciones.body), producto);
    return Response.json({ mensaje: "Creado", datos: { id: "p1", ...producto } }, { status: 201 });
  });
  assert.deepEqual(await crearProducto(producto), { id: "p1", ...producto });
});

test("un 409 conserva el mensaje y el error del campo nombre para el formulario", async t => {
  const mensaje = "Ya existe un producto con ese nombre.";
  t.mock.method(globalThis, "fetch", async () => Response.json({ mensaje, errores: { nombre: mensaje } }, { status: 409 }));
  await assert.rejects(crearProducto({ nombre: "Bocina" }), error => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.message, mensaje);
    assert.equal(error.errores.nombre, mensaje);
    return true;
  });
});

test("rechaza una respuesta GET que no sea un arreglo", async t => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ datos: [] }));
  await assert.rejects(listarProductos(), ApiError);
});

test("muestra un error controlado si no hay conexión", async t => {
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("Network error"); });
  await assert.rejects(listarProductos(), /No se pudo conectar/);
});
