import { randomUUID } from "node:crypto";
import { normalizarNombre } from "../domain/nombre-producto.js";
import { ProductoDuplicadoError } from "../errors/producto-duplicado.error.js";

// Solo el repositorio conoce el formato de los documentos en MongoDB.
export class ProductosRepository {
  #coleccion;

  constructor(coleccion) {
    this.#coleccion = coleccion;
  }

  async listar() {
    const documentos = await this.#coleccion.find({}, {
      projection: { _id: 1, nombre: 1, precio: 1, categoria: 1 },
    }).toArray();
    return documentos.map(({ _id, ...producto }) => ({ id: _id, ...producto }));
  }

  async crear(datos) {
    const documento = {
      ...datos,
      _id: randomUUID(),
      nombreNormalizado: normalizarNombre(datos.nombre),
    };
    try {
      // El índice único protege incluso dos POST que llegan al mismo tiempo.
      await this.#coleccion.insertOne(documento);
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.nombreNormalizado) {
        throw new ProductoDuplicadoError();
      }
      throw error;
    }
    const { _id, nombre, precio, categoria } = documento;
    return { id: _id, nombre, precio, categoria };
  }
}
