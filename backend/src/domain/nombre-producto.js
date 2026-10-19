// Conserva los acentos; ignora mayúsculas, espacios sobrantes y variantes Unicode.
export function normalizarNombre(nombre) {
  return nombre.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("es");
}
