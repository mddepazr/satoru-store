import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { MongoMemoryServer } from "mongodb-memory-server";
import { crearApp } from "../src/app.js";
import { conectarBaseDeDatos } from "../src/config/database.js";
import { ProductosRepository } from "../src/repositories/productos.repository.js";
import { cargarProductosIniciales } from "../src/data/productos-iniciales.js";

// Usa un MongoDB real aislado. Nunca toca la base de datos del proyecto.
test("API con MongoDB: escritura, validación, persistencia y errores", { timeout: 180000 }, async (t) => {
  const directorio = await mkdtemp(join(tmpdir(), "satoru-test-"));
  let mongo;
  let conexion;
  let servidor;
  let url;

  async function iniciarMongo() {
    mongo = await MongoMemoryServer.create({
      instance: { dbPath: directorio, storageEngine: "wiredTiger", args: process.platform === "win32" ? [] : ["--nounixsocket"] },
      binary: { version: "7.0.24" },
    });
    conexion = await conectarBaseDeDatos({ uri: mongo.getUri(), nombre: "satoru_test" });
  }

  async function iniciarApi(repository = new ProductosRepository(conexion.db.collection("productos"))) {
    servidor = crearApp(repository).listen(0, "127.0.0.1");
    await new Promise(resolve => servidor.once("listening", resolve));
    url = `http://127.0.0.1:${servidor.address().port}`;
  }

  async function cerrarApi() {
    if (servidor) await new Promise((resolve, reject) => servidor.close(error => error ? reject(error) : resolve()));
    servidor = undefined;
  }

  function crear(datos) {
    return fetch(`${url}/api/productos`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
  }

  try {
    await iniciarMongo();
    const coleccion = conexion.db.collection("productos");
    await cargarProductosIniciales(coleccion);
    await iniciarApi();
    let creado;

    await t.test("GET devuelve JSON y POST guarda realmente en MongoDB", async () => {
      let respuesta = await fetch(`${url}/api/productos`);
      assert.equal(respuesta.status, 200);
      assert.equal((await respuesta.json()).datos.length, 3);
      respuesta = await crear({ nombre: " Audífonos ", precio: 299.9, categoria: " Audio ", id: "externo", extra: true });
      assert.equal(respuesta.status, 201);
      creado = (await respuesta.json()).datos;
      assert.equal(creado.nombre, "Audífonos");
      assert.equal(creado.categoria, "Audio");
      assert.notEqual(creado.id, "externo");
      const guardado = await coleccion.findOne({ _id: creado.id });
      assert.equal(guardado.precio, 299.9);
      assert.equal(guardado.extra, undefined);
    });

    await t.test("datos inválidos no llegan a la colección", async () => {
      const cantidad = await coleccion.countDocuments();
      for (const datos of [null, [], { nombre: "", precio: -1, categoria: "" }, { nombre: "Mouse", precio: "10", categoria: "Audio" }, { nombre: "Mouse", precio: 1.234, categoria: "Audio" }]) {
        const respuesta = await crear(datos);
        assert.equal(respuesta.status, 400);
        assert.ok((await respuesta.json()).mensaje);
      }
      assert.equal(await coleccion.countDocuments(), cantidad);
    });

    await t.test("JSON inválido, tamaño excesivo, tipo de contenido y ruta inexistente", async () => {
      let respuesta = await fetch(`${url}/api/productos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
      assert.equal(respuesta.status, 400);
      respuesta = await crear({ nombre: "a".repeat(11000) });
      assert.equal(respuesta.status, 413);
      respuesta = await fetch(`${url}/api/productos`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: "texto" });
      assert.equal(respuesta.status, 415);
      respuesta = await fetch(`${url}/inexistente`);
      assert.equal(respuesta.status, 404);
    });

    await t.test("reiniciar API y MongoDB conserva el producto; seed no duplica ni sobrescribe", async () => {
      await coleccion.updateOne({ _id: "producto-001" }, { $set: { precio: 500 } });
      await cerrarApi();
      await conexion.cliente.close();
      await mongo.stop({ doCleanup: false, force: false });
      await iniciarMongo();
      await cargarProductosIniciales(conexion.db.collection("productos"));
      await cargarProductosIniciales(conexion.db.collection("productos"));
      await iniciarApi();
      const productos = (await (await fetch(`${url}/api/productos`)).json()).datos;
      assert.equal(productos.length, 4);
      assert.deepEqual(productos.find(p => p.id === creado.id), creado);
      assert.equal(productos.find(p => p.id === "producto-001").precio, 500);
    });

    // Windows no permite simular Ctrl+C con child.kill como en Linux.
    await t.test("server.js inicia con MongoDB y termina correctamente con Ctrl+C", { skip: process.platform === "win32" }, async () => {
      const hijo = spawn(process.execPath, [fileURLToPath(new URL("../src/server.js", import.meta.url))], {
        env: { ...process.env, MONGODB_URI: mongo.getUri(), MONGODB_DB: "satoru_test", PORT: "0" },
        stdio: ["ignore", "pipe", "pipe"],
      });
      const salida = new Promise((resolve, reject) => {
        hijo.once("error", reject);
        hijo.once("exit", (code, signal) => resolve({ code, signal }));
      });
      let texto = "";
      let temporizador;
      try {
        await Promise.race([
          new Promise(resolve => hijo.stdout.on("data", dato => {
            texto += dato;
            if (texto.includes("Satoru Store API:")) resolve();
          })),
          salida.then(() => { throw new Error("El servidor terminó antes de iniciar"); }),
          new Promise((_, reject) => { temporizador = setTimeout(() => reject(new Error("Tiempo de inicio agotado")), 10000); }),
        ]);
        assert.ok(texto.includes("MongoDB conectado:"));
        hijo.kill("SIGINT");
        const resultado = await salida;
        assert.equal(resultado.code, 0);
      } finally {
        clearTimeout(temporizador);
        if (hijo.exitCode === null && hijo.signalCode === null) hijo.kill();
      }
    });

    await t.test("MongoDB apagado produce un error JSON 503", async () => {
      await mongo.stop({ doCleanup: false, force: false });
      const respuesta = await fetch(`${url}/api/productos`);
      assert.equal(respuesta.status, 503);
      assert.equal((await respuesta.json()).mensaje, "La base de datos no está disponible. Intenta nuevamente.");
    });

    await t.test("fallo inesperado devuelve 500 sin exponer detalles", async () => {
      await cerrarApi();
      await iniciarApi({ listar: async () => { throw new Error("detalle privado"); } });
      const respuesta = await fetch(`${url}/api/productos`);
      assert.equal(respuesta.status, 500);
      assert.ok(!(await respuesta.text()).includes("detalle privado"));
    });
  } finally {
    await cerrarApi();
    await conexion?.cliente.close();
    await mongo?.stop({ doCleanup: false, force: false });
    await rm(directorio, { recursive: true, force: true });
  }
});
