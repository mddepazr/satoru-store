import { normalizarNombre } from "../domain/nombre-producto.js";

// Prepara registros anteriores antes de exigir nombres únicos. Nunca elimina productos.
export async function prepararColeccionProductos(coleccion) {
  const documentos = await coleccion.find({}, {
    projection: { _id: 1, nombre: 1, nombreNormalizado: 1 },
  }).toArray();
  const grupos = new Map();
  const cambios = [];
  for (const producto of documentos) {
    if (typeof producto.nombre !== "string" || !producto.nombre.trim()) {
      throw Object.assign(new Error(`El producto ${producto._id} no tiene un nombre válido. Corrígelo en Compass.`), { name: "PreparacionProductosError" });
    }
    const clave = normalizarNombre(producto.nombre);
    const ids = grupos.get(clave) ?? [];
    ids.push(String(producto._id));
    grupos.set(clave, ids);
    if (producto.nombreNormalizado !== clave) {
      cambios.push({ updateOne: { filter: { _id: producto._id }, update: { $set: { nombreNormalizado: clave } } } });
    }
  }

  const repetidos = [...grupos.entries()].filter(([, ids]) => ids.length > 1);
  if (repetidos.length) {
    const detalle = repetidos.map(([nombre, ids]) => `${nombre}: ${ids.join(", ")}`).join("; ");
    // Se informa antes de escribir. El usuario decide qué registros corregir.
    throw Object.assign(new Error(`Hay nombres duplicados. Corrígelos en Compass y reinicia. ${detalle}`), { name: "PreparacionProductosError" });
  }
  if (cambios.length) await coleccion.bulkWrite(cambios);
  await coleccion.createIndex({ nombreNormalizado: 1 }, { unique: true, name: "nombre_producto_unico" });
}
