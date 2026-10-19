import assert from "node:assert/strict";
import { test } from "node:test";
import { validarProducto, obtenerErroresProducto } from "../../src/validators/producto.validator.js";
import { normalizarNombre } from "../../src/domain/nombre-producto.js";

const productoValido = { nombre: "Bocina", precio: 150, categoria: "Audio" };

// Arrange: preparar la entrada. Act: ejecutar. Assert: comparar con lo esperado.
test("acepta un producto con nombre, precio y categoría válidos", () => {
  const entrada = { ...productoValido };
  const resultado = validarProducto(entrada);
  assert.equal(resultado, true);
});

test("rechaza un precio negativo", () => {
  const entrada = { ...productoValido, precio: -1 };
  assert.equal(validarProducto(entrada), false);
  assert.ok(obtenerErroresProducto(entrada).precio);
});

test("rechaza una categoría vacía", () => {
  assert.equal(validarProducto({ ...productoValido, categoria: "   " }), false);
});

test("rechaza un nombre compuesto solo por espacios", () => {
  assert.equal(validarProducto({ ...productoValido, nombre: "  " }), false);
});

test("rechaza null, arreglos y texto como producto", () => {
  for (const entrada of [null, [], "producto", undefined]) {
    assert.equal(validarProducto(entrada), false);
  }
});

test("exige un precio numérico, finito, positivo y con hasta dos decimales", () => {
  for (const precio of ["150", NaN, Infinity, 0, 1000000.01, 1.234]) {
    assert.equal(validarProducto({ ...productoValido, precio }), false);
  }
  for (const precio of [0.01, 299.9, 1000000]) {
    assert.equal(validarProducto({ ...productoValido, precio }), true);
  }
});

test("respeta los límites de longitud de nombre y categoría", () => {
  assert.equal(validarProducto({ nombre: "AB", precio: 10, categoria: "CD" }), true);
  assert.equal(validarProducto({ nombre: "A".repeat(80), precio: 10, categoria: "B".repeat(40) }), true);
  assert.equal(validarProducto({ ...productoValido, nombre: "A".repeat(81) }), false);
  assert.equal(validarProducto({ ...productoValido, categoria: "A".repeat(41) }), false);
});

test("normaliza mayúsculas y espacios para identificar nombres repetidos", () => {
  for (const nombre of ["Bocina", "bocina", "BOCINA", " Bocina "]) {
    assert.equal(normalizarNombre(nombre), "bocina");
  }
  assert.equal(normalizarNombre("Bocina   portátil"), "bocina portátil");
  assert.equal(normalizarNombre("Cafe\u0301"), normalizarNombre("Café"));
});

test("validar no modifica el objeto recibido", () => {
  const entrada = Object.freeze({ ...productoValido, nombre: " Bocina " });
  assert.equal(validarProducto(entrada), true);
  assert.equal(entrada.nombre, " Bocina ");
});
