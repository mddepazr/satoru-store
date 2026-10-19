import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { iniciarMongoPruebas, crearContexto } from "../helpers/mongodb.js";
import { ProductosRepository } from "../../src/repositories/productos.repository.js";

let mongo;
before(async () => { mongo = await iniciarMongoPruebas(); }, { timeout: 180000 });
after(async () => { await mongo?.cerrar(); });
const bocina = { nombre: "Bocina", precio: 150, categoria: "Audio" };

// AAA: cada prueba prepara sus datos, hace la petición y comprueba su respuesta.
test("GET /api/productos devuelve 200, un arreglo y los campos esperados", async t => {
  const contexto = await crearContexto(t, mongo);
  await new ProductosRepository(contexto.coleccion).crear(bocina);
  const respuesta = await contexto.get();
  const productos = await respuesta.json();
  assert.equal(respuesta.status, 200);
  assert.match(respuesta.headers.get("content-type"), /application\/json/);
  assert.ok(Array.isArray(productos));
  assert.equal(productos.length, 1);
  for (const producto of productos) {
    assert.equal(typeof producto.id, "string");
    assert.equal(producto.nombre, bocina.nombre);
    assert.equal(producto.precio, bocina.precio);
    assert.equal(producto.categoria, bocina.categoria);
    assert.equal(producto.nombreNormalizado, undefined);
  }
});

test("GET sin registros devuelve un arreglo vacío", async t => {
  const contexto = await crearContexto(t, mongo);
  const respuesta = await contexto.get();
  assert.equal(respuesta.status, 200);
  assert.deepEqual(await respuesta.json(), []);
});

test("POST válido devuelve 201 y guarda solamente los campos permitidos", async t => {
  const contexto = await crearContexto(t, mongo);
  const respuesta = await contexto.post({ ...bocina, nombre: " Bocina ", id: "externo", nombreNormalizado: "inventado", extra: true });
  const body = await respuesta.json();
  assert.equal(respuesta.status, 201);
  assert.equal(body.mensaje, "Producto agregado correctamente.");
  assert.notEqual(body.datos.id, "externo");
  assert.equal(body.datos.nombre, "Bocina");
  const documento = await contexto.coleccion.findOne({ _id: body.datos.id });
  assert.equal(documento.nombreNormalizado, "bocina");
  assert.equal(documento.precio, 150);
  assert.equal(documento.extra, undefined);
  assert.equal(body.datos.nombreNormalizado, undefined);
});

test("POST con precio negativo devuelve 400 y no guarda el producto", async t => {
  const contexto = await crearContexto(t, mongo);
  const respuesta = await contexto.post({ ...bocina, precio: -1 });
  const body = await respuesta.json();
  assert.equal(respuesta.status, 400);
  assert.ok(body.mensaje);
  assert.ok(body.errores.precio);
  assert.equal(await contexto.coleccion.countDocuments(), 0);
});

test("POST rechaza nombres duplicados aunque cambien mayúsculas o espacios", async t => {
  const contexto = await crearContexto(t, mongo);
  assert.equal((await contexto.post(bocina)).status, 201);
  for (const nombre of ["Bocina", "bocina", "BOCINA", " Bocina "]) {
    const respuesta = await contexto.post({ ...bocina, nombre });
    const body = await respuesta.json();
    assert.equal(respuesta.status, 409);
    assert.equal(body.mensaje, "Ya existe un producto con ese nombre.");
    assert.equal(body.errores.nombre, body.mensaje);
  }
  assert.equal(await contexto.coleccion.countDocuments(), 1);
});

test("dos POST simultáneos del mismo nombre crean solo un documento", async t => {
  const contexto = await crearContexto(t, mongo);
  const respuestas = await Promise.all([contexto.post(bocina), contexto.post({ ...bocina, nombre: "BOCINA" })]);
  assert.deepEqual(respuestas.map(res => res.status).sort(), [201, 409]);
  assert.equal(await contexto.coleccion.countDocuments(), 1);
});

for (const caso of [
  { nombre: "JSON mal formado", status: 400, tipo: "application/json", body: "{" },
  { nombre: "tipo de contenido incorrecto", status: 415, tipo: "text/plain", body: "texto" },
  { nombre: "solicitud mayor de 10 KB", status: 413, tipo: "application/json", body: JSON.stringify({ nombre: "A".repeat(11000) }) },
]) {
  test(`POST maneja ${caso.nombre} con JSON ${caso.status}`, async t => {
    const contexto = await crearContexto(t, mongo);
    const respuesta = await fetch(`${contexto.url}/api/productos`, {
      method: "POST", headers: { "Content-Type": caso.tipo }, body: caso.body,
    });
    assert.equal(respuesta.status, caso.status);
    assert.ok((await respuesta.json()).mensaje);
    assert.equal(await contexto.coleccion.countDocuments(), 0);
  });
}

test("una ruta inexistente devuelve JSON 404", async t => {
  const contexto = await crearContexto(t, mongo);
  const respuesta = await fetch(`${contexto.url}/no-existe`);
  assert.equal(respuesta.status, 404);
  assert.ok((await respuesta.json()).mensaje);
});

test("un fallo inesperado devuelve JSON 500 sin revelar el detalle interno", async t => {
  const { crearApp } = await import("../../src/app.js");
  const { once } = await import("node:events");
  t.mock.method(console, "error", () => {});
  const servidor = crearApp({ listar: async () => { throw new Error("detalle privado"); } }).listen(0, "127.0.0.1");
  t.after(() => new Promise(resolve => servidor.close(resolve)));
  await once(servidor, "listening");
  const respuesta = await fetch(`http://127.0.0.1:${servidor.address().port}/api/productos`);
  assert.equal(respuesta.status, 500);
  const body = await respuesta.json();
  assert.equal(body.mensaje, "Ocurrió un error en el servidor. Intenta nuevamente.");
  assert.ok(!JSON.stringify(body).includes("detalle privado"));
});
