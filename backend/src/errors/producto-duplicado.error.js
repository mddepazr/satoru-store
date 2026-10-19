// El repositorio informa el conflicto sin exponer detalles técnicos de MongoDB.
export class ProductoDuplicadoError extends Error {
  constructor() {
    super("Ya existe un producto con ese nombre.");
    this.name = "ProductoDuplicadoError";
    this.status = 409;
    this.errores = { nombre: this.message };
  }
}
