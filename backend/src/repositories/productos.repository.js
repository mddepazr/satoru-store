import { randomUUID } from "node:crypto";

// Guarda documentos en MongoDB; no conoce las reglas de validación ni Express.
export class ProductosRepository {
  #coleccion;

  constructor(coleccion) {
    this.#coleccion = coleccion;
  }

  async listar() {
    const documentos = await this.#coleccion.find({}, {
      projection: { _id: 1, nombre: 1, precio: 1, categoria: 1 },
    }).toArray();

    // MongoDB usa _id; la API conserva id para que React funcione igual.
    return documentos.map(({ _id, ...producto }) => ({ id: _id, ...producto }));
  }

  async crear(datos) {
    const documento = { ...datos, _id: randomUUID() };
    // Solo confirma el producto después de que MongoDB acepte la escritura.
    await this.#coleccion.insertOne(documento);
    const { _id, ...producto } = documento;
    return { id: _id, ...producto };
  }
}
