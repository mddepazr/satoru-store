export class ProductosService {
  constructor(repository) {
    this.repository = repository;
  }

  listar() {
    return this.repository.listar();
  }

  crear(datos) {
    const errores = {};

    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
      throw Object.assign(new Error("Envía un objeto JSON válido."), {
        status: 400,
      });
    }

    const nombre = typeof datos.nombre === "string"
      ? datos.nombre.trim()
      : "";

    const categoria = typeof datos.categoria === "string"
      ? datos.categoria.trim()
      : "";

    if (nombre.length < 2 || nombre.length > 80) {
      errores.nombre = "El nombre debe tener entre 2 y 80 caracteres.";
    }

    if (categoria.length < 2 || categoria.length > 40) {
      errores.categoria = "La categoría debe tener entre 2 y 40 caracteres.";
    }

    const precio = datos.precio;

    if (
      typeof precio !== "number" ||
      !Number.isFinite(precio) ||
      precio <= 0 ||
      precio > 1000000
    ) {
      errores.precio = "El precio debe ser mayor que 0 y no superar Q1,000,000.";
    } else if (
      Math.abs(precio * 100 - Math.round(precio * 100)) > 0.000001
    ) {
      errores.precio = "El precio admite hasta dos decimales.";
    }

    if (Object.keys(errores).length > 0) {
      throw Object.assign(new Error("Revisa los campos del producto."), {
        status: 400,
        errores,
      });
    }

    // Guarda únicamente los campos permitidos.
    return this.repository.crear({
      nombre,
      precio: Math.round(precio * 100) / 100,
      categoria,
    });
  }
}