import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { MongoMemoryServer } from "mongodb-memory-server";
import { conectarBaseDeDatos } from "../../src/config/database.js";
import { prepararColeccionProductos } from "../../src/config/productos.collection.js";
import { ProductosRepository } from "../../src/repositories/productos.repository.js";
import { crearApp } from "../../src/app.js";

// MongoDB real en un directorio temporal. Nunca utiliza MONGODB_URI del usuario.
export async function iniciarMongoPruebas() {
  const directorio = await mkdtemp(join(tmpdir(), "satoru-semana14-"));
  let mongo;
  async function iniciar() {
    mongo = await MongoMemoryServer.create({
      instance: {
        dbPath: directorio, storageEngine: "wiredTiger",
        args: process.platform === "win32" ? [] : ["--nounixsocket"],
      },
      binary: { version: "7.0.24" },
    });
  }
  try {
    await iniciar();
  } catch (error) {
    await rm(directorio, { recursive: true, force: true });
    throw error;
  }
  return {
    get uri() { return mongo.getUri(); },
    async reiniciar() {
      await mongo.stop({ doCleanup: false, force: false });
      await iniciar();
    },
    async apagar() {
      await mongo.stop({ doCleanup: false, force: false });
    },
    async cerrar() {
      await mongo.stop({ doCleanup: false, force: false });
      await rm(directorio, { recursive: true, force: true });
    },
  };
}

export async function crearContexto(t, mongo, nombre = `test_${randomUUID().replaceAll("-", "")}`) {
  const { cliente, db } = await conectarBaseDeDatos({ uri: mongo.uri, nombre });
  let servidor;
  let cerrado = false;
  async function cerrar() {
    if (cerrado) return;
    cerrado = true;
    if (servidor?.listening) await new Promise((resolve, reject) => servidor.close(error => error ? reject(error) : resolve()));
    await cliente.close();
  }
  // Cada caso tiene su propia base; no depende de los productos de otra prueba.
  t.after(cerrar);
  const coleccion = db.collection("productos");
  await prepararColeccionProductos(coleccion);
  servidor = crearApp(new ProductosRepository(coleccion)).listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const url = `http://127.0.0.1:${servidor.address().port}`;
  return {
    db, coleccion, nombre, cerrar, url,
    get: () => fetch(`${url}/api/productos`),
    post: producto => fetch(`${url}/api/productos`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(producto),
    }),
  };
}
