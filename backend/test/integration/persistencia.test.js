import assert from "node:assert/strict";
import { test } from "node:test";
import { iniciarMongoPruebas, crearContexto } from "../helpers/mongodb.js";
import { prepararColeccionProductos } from "../../src/config/productos.collection.js";
import { cargarProductosIniciales } from "../../src/data/productos-iniciales.js";

// Estos escenarios requieren reiniciar su propio proceso, sin afectar otros tests.
test("el producto permanece después de reiniciar API y MongoDB", async t => {
  const mongo = await iniciarMongoPruebas();
  t.after(() => mongo.cerrar());
  const inicial = await crearContexto(t, mongo);
  const respuestaCreacion = await inicial.post({ nombre: "Bocina", precio: 150, categoria: "Audio" });
  assert.equal(respuestaCreacion.status, 201);
  const creado = (await respuestaCreacion.json()).datos;
  assert.equal(await inicial.coleccion.countDocuments(), 1);
  await inicial.cerrar();
  await mongo.reiniciar();
  const reiniciado = await crearContexto(t, mongo, inicial.nombre);
  assert.deepEqual(await (await reiniciado.get()).json(), [creado]);
  assert.equal((await reiniciado.post({ nombre: "bocina", precio: 100, categoria: "Audio" })).status, 409);
  await reiniciado.cerrar();
});

test("seed se puede repetir y conserva cambios y productos existentes", async t => {
  const mongo = await iniciarMongoPruebas();
  t.after(() => mongo.cerrar());
  const contexto = await crearContexto(t, mongo);
  await cargarProductosIniciales(contexto.coleccion);
  await contexto.coleccion.updateOne({ _id: "producto-001" }, { $set: { precio: 500 } });
  await contexto.post({ nombre: "Bocina", precio: 150, categoria: "Audio" });
  await cargarProductosIniciales(contexto.coleccion);
  assert.equal(await contexto.coleccion.countDocuments(), 4);
  assert.equal((await contexto.coleccion.findOne({ _id: "producto-001" })).precio, 500);
  await contexto.cerrar();
});

test("preparar la colección incorpora nombres antiguos sin cambiar los campos del producto", async t => {
  const mongo = await iniciarMongoPruebas();
  t.after(() => mongo.cerrar());
  const contexto = await crearContexto(t, mongo);
  const antigua = contexto.db.collection("antiguos");
  const documento = { _id: "anterior", nombre: " Bocina ", precio: 100, categoria: "Audio" };
  await antigua.insertOne(documento);
  await prepararColeccionProductos(antigua);
  await prepararColeccionProductos(antigua);
  assert.deepEqual(await antigua.findOne({ _id: "anterior" }), { ...documento, nombreNormalizado: "bocina" });
  await assert.rejects(antigua.insertOne({ ...documento, _id: "otro", nombreNormalizado: "bocina" }), { code: 11000 });
  await contexto.cerrar();
});

test("duplicados anteriores detienen la preparación sin borrar ni modificar documentos", async t => {
  const mongo = await iniciarMongoPruebas();
  t.after(() => mongo.cerrar());
  const contexto = await crearContexto(t, mongo);
  const antigua = contexto.db.collection("duplicados_antiguos");
  await antigua.insertMany([
    { _id: "a", nombre: "Bocina" }, { _id: "b", nombre: " BOCINA " },
  ]);
  const antes = await antigua.find().toArray();
  await assert.rejects(prepararColeccionProductos(antigua), /Hay nombres duplicados/);
  assert.deepEqual(await antigua.find().toArray(), antes);
  await contexto.cerrar();
});

test("MongoDB apagado produce una respuesta JSON 503", async t => {
  const mongo = await iniciarMongoPruebas();
  t.after(() => mongo.cerrar());
  const contexto = await crearContexto(t, mongo);
  await mongo.apagar();
  const respuesta = await contexto.get();
  assert.equal(respuesta.status, 503);
  assert.equal((await respuesta.json()).mensaje, "La base de datos no está disponible. Intenta nuevamente.");
  await contexto.cerrar();
});

test("seed respeta un ejemplo que ya existe con otro identificador", async t => {
  const mongo = await iniciarMongoPruebas();
  t.after(() => mongo.cerrar());
  const contexto = await crearContexto(t, mongo);
  const respuesta = await contexto.post({ nombre: "TECLADO MECÁNICO", precio: 500, categoria: "Periféricos" });
  const creado = (await respuesta.json()).datos;
  await cargarProductosIniciales(contexto.coleccion);
  assert.equal(await contexto.coleccion.countDocuments(), 3);
  assert.equal((await contexto.coleccion.findOne({ nombreNormalizado: "teclado mecánico" }))._id, creado.id);
  await contexto.cerrar();
});
