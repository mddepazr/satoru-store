import { normalizarNombre } from "../domain/nombre-producto.js";

export const productosIniciales = [
  { _id: "producto-001", nombre: "Teclado mecánico", precio: 450, categoria: "Periféricos" },
  { _id: "producto-002", nombre: "Mouse inalámbrico", precio: 175, categoria: "Periféricos" },
  { _id: "producto-003", nombre: "Monitor de 24 pulgadas", precio: 1450, categoria: "Monitores" },
];

export async function cargarProductosIniciales(coleccion) {
  // Inserta cada ejemplo solo si no existe: repetir seed no borra ni duplica datos.
  for (const producto of productosIniciales) {
    const nombreNormalizado = normalizarNombre(producto.nombre);
    await coleccion.updateOne(
      { $or: [{ _id: producto._id }, { nombreNormalizado }] },
      { $setOnInsert: { ...producto, nombreNormalizado } },
      { upsert: true },
    );
  }
}
