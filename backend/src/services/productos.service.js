import { obtenerErroresProducto } from "../validators/producto.validator.js";

// Aplica las reglas del producto; el almacenamiento llega por inyección.
export class ProductosService {
  constructor(repository) {
    this.repository = repository;
  }

  listar() {
    return this.repository.listar();
  }

  crear(datos) {
    const errores = obtenerErroresProducto(datos);
    if (Object.keys(errores).length > 0) {
      throw Object.assign(new Error(errores.producto ?? "Revisa los campos del producto."), {
        status: 400,
        errores,
      });
    }

    // El cliente no puede elegir el id ni la clave interna para detectar duplicados.
    return this.repository.crear({
      nombre: datos.nombre.trim(),
      precio: Math.round(datos.precio * 100) / 100,
      categoria: datos.categoria.trim(),
    });
  }
}
