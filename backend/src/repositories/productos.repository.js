import { randomUUID } from "node:crypto";

export class ProductosRepository {
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

  async listar() {
    // Devuelve copias para proteger el arreglo interno.
    return this.#productos.map((producto) => ({ ...producto }));
  }

  async crear(datos) {
    const producto = { ...datos, id: randomUUID() };
    this.#productos.push(producto);
    return { ...producto };
  }
}