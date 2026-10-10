// Reúne las reglas del producto, sin depender de Express ni de cómo se almacena.
export class ProductosService {
  // Recibe el repositorio desde afuera para poder sustituirlo por uno de base de datos.
  constructor(repository) {
    this.repository = repository;
  }

  listar() {
    return this.repository.listar();
  }

  crear(datos) {
    // Agrupa los errores por campo para que React los muestre junto a cada entrada.
    const errores = {};

    // Rechaza valores que no representen un objeto de producto.
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
      throw Object.assign(new Error("Envía un objeto JSON válido."), {
        status: 400,
      });
    }

    // trim() elimina espacios de los extremos antes de validar y guardar.
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

    // La API exige un número real: no acepta un precio enviado como texto.
    const precio = datos.precio;

    if (
      typeof precio !== "number" ||
      !Number.isFinite(precio) ||
      precio <= 0 ||
      precio > 1000000
    ) {
      errores.precio = "El precio debe ser mayor que 0 y no superar Q1,000,000.";
    } else if (
      // Tolera pequeñas diferencias de coma flotante al comprobar los centavos.
      Math.abs(precio * 100 - Math.round(precio * 100)) > 0.000001
    ) {
      errores.precio = "El precio admite hasta dos decimales.";
    }

    // Un error 400 indica datos inválidos; el middleware arma la respuesta HTTP.
    if (Object.keys(errores).length > 0) {
      throw Object.assign(new Error("Revisa los campos del producto."), {
        status: 400,
        errores,
      });
    }

    // Guarda únicamente los campos permitidos.
    return this.repository.crear({
      nombre,
      // Normaliza el valor a centavos después de comprobar los dos decimales.
      precio: Math.round(precio * 100) / 100,
      categoria,
    });
  }
}