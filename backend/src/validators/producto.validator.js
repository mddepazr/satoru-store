// Funciones puras: revisan reglas sin acceder a HTTP ni a MongoDB.
export function obtenerErroresProducto(producto) {
  if (!producto || typeof producto !== "object" || Array.isArray(producto)) {
    return { producto: "Envía un objeto JSON válido." };
  }

  const errores = {};
  const nombre = typeof producto.nombre === "string" ? producto.nombre.trim() : "";
  const categoria = typeof producto.categoria === "string" ? producto.categoria.trim() : "";
  if (nombre.length < 2 || nombre.length > 80) {
    errores.nombre = "El nombre debe tener entre 2 y 80 caracteres.";
  }
  if (categoria.length < 2 || categoria.length > 40) {
    errores.categoria = "La categoría debe tener entre 2 y 40 caracteres.";
  }
  const precio = producto.precio;
  if (typeof precio !== "number" || !Number.isFinite(precio) || precio <= 0 || precio > 1000000) {
    errores.precio = "El precio debe ser mayor que 0 y no superar Q1,000,000.";
  } else if (Math.abs(precio * 100 - Math.round(precio * 100)) > 0.000001) {
    // La tolerancia evita rechazar centavos válidos por diferencias de coma flotante.
    errores.precio = "El precio admite hasta dos decimales.";
  }
  return errores;
}

// La práctica pide un resultado booleano; comparte las reglas usadas por el servicio.
export function validarProducto(producto) {
  return Object.keys(obtenerErroresProducto(producto)).length === 0;
}
