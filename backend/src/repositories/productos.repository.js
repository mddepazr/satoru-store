import { randomUUID } from "node:crypto";

// Se encarga únicamente del almacenamiento temporal de los productos.
export class ProductosRepository {
  // # hace privado el arreglo. Al reiniciar la API se recuperan estos datos iniciales.
  #productos = [
    {
      id: "producto-001",
      nombre: "Teclado mecánico",
      precio: 450,
      categoria: "Periféricos",
    },
    {
      id: "producto-002",
      nombre: "Mouse inalámbrico",
      precio: 175,
      categoria: "Periféricos",
    },
    {
      id: "producto-003",
      nombre: "Monitor de 24 pulgadas",
      precio: 1450,
      categoria: "Monitores",
    },
  ];

  // El contrato async permite incorporar una base de datos sin cambiar el servicio.
  async listar() {
    // Devuelve copias para proteger el arreglo interno.
    return this.#productos.map((producto) => ({ ...producto }));
  }

  async crear(datos) {
    // El servidor genera el identificador; no depende de un id enviado por el usuario.
    const producto = { ...datos, id: randomUUID() };
    this.#productos.push(producto);
    // Devuelve una copia para que el consumidor no modifique el objeto guardado.
    return { ...producto };
  }
}