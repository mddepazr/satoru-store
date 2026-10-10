import { useState } from "react";

// Recibe acciones del componente padre; no conoce la URL ni el almacenamiento.
export default function ProductoForm({ onGuardar, onCerrar, bloqueado }) {
  // Incluso el input numérico entrega texto; se convierte a número al enviar.
  const [campos, setCampos] = useState({
    nombre: "",
    precio: "",
    categoria: "",
  });
  // errores corresponde a cada campo; error es el mensaje general del envío.
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  function cambiar(event) {
    const { name, value } = event.target;
    // [name] modifica solo el campo editado; el resto conserva sus valores.
    setCampos((actual) => ({ ...actual, [name]: value }));
    setErrores((actual) => ({ ...actual, [name]: "" }));
    setError("");
  }

  async function enviar(event) {
    // Evita la recarga del navegador para gestionar el envío con React.
    event.preventDefault();
    // Bloquea envíos repetidos mientras hay una solicitud en curso.
    if (guardando || bloqueado) return;

    // Valida para dar respuesta inmediata; la API vuelve a validar por seguridad.
    const nuevosErrores = {};
    const nombre = campos.nombre.trim();
    const categoria = campos.categoria.trim();
    const precio = Number(campos.precio);

    if (nombre.length < 2 || nombre.length > 80) {
      nuevosErrores.nombre = "Escribe entre 2 y 80 caracteres.";
    }
    if (categoria.length < 2 || categoria.length > 40) {
      nuevosErrores.categoria = "Escribe entre 2 y 40 caracteres.";
    }
    if (
      // Comprueba el campo vacío porque Number("") devuelve 0.
      !campos.precio.trim() ||
      !Number.isFinite(precio) ||
      precio <= 0 ||
      precio > 1000000
    ) {
      nuevosErrores.precio = "Ingresa un precio mayor que 0 y hasta Q1,000,000.";
    } else if (
      Math.abs(precio * 100 - Math.round(precio * 100)) > 0.000001
    ) {
      nuevosErrores.precio = "Usa hasta dos decimales.";
    }

    setErrores(nuevosErrores);
    setError("");

    if (Object.keys(nuevosErrores).length) return;

    setGuardando(true);

    try {
      // Espera la confirmación del servidor antes de limpiar los campos.
      await onGuardar({ nombre, precio, categoria });
      setCampos({ nombre: "", precio: "", categoria: "" });
      // Conserva lo escrito y muestra el error para que el usuario pueda corregirlo.
    } catch (fallo) {
      setErrores(fallo.errores ?? {});
      setError(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <aside className="form-panel" aria-labelledby="form-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">NUEVO REGISTRO</p>
          <h2 id="form-title">Agregar producto</h2>
        </div>
        <button
          type="button"
          className="close-button"
          onClick={onCerrar}
          disabled={guardando}
          aria-label="Cerrar formulario"
        >
          ×
        </button>
      </div>

      {/* noValidate permite mostrar nuestros mensajes en lugar de los avisos nativos. */}
      <form onSubmit={enviar} noValidate>
        {/* Deshabilita todos los controles durante el envío o una falla de conexión. */}
        <fieldset disabled={guardando || bloqueado}>
          {/* htmlFor une etiqueta y campo; aria-describedby une campo y error. */}
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            value={campos.nombre}
            onChange={cambiar}
            placeholder="Ej. Audífonos inalámbricos"
            maxLength={80}
            aria-invalid={Boolean(errores.nombre)}
            aria-describedby={errores.nombre ? "error-nombre" : undefined}
          />
          {errores.nombre && (
            <p className="field-error" id="error-nombre">{errores.nombre}</p>
          )}

          <label htmlFor="precio">Precio en quetzales</label>
          <input
            id="precio"
            name="precio"
            type="number"
            min="0.01"
            max="1000000"
            step="0.01"
            value={campos.precio}
            onChange={cambiar}
            placeholder="0.00"
            aria-invalid={Boolean(errores.precio)}
            aria-describedby={errores.precio ? "error-precio" : undefined}
          />
          {errores.precio && (
            <p className="field-error" id="error-precio">{errores.precio}</p>
          )}

          <label htmlFor="categoria">Categoría</label>
          <input
            id="categoria"
            name="categoria"
            value={campos.categoria}
            onChange={cambiar}
            placeholder="Ej. Audio"
            maxLength={40}
            aria-invalid={Boolean(errores.categoria)}
            aria-describedby={errores.categoria ? "error-categoria" : undefined}
          />
          {errores.categoria && (
            <p className="field-error" id="error-categoria">{errores.categoria}</p>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="primary-button full-width" type="submit">
            {guardando ? "Guardando..." : "Guardar producto"}
          </button>
        </fieldset>
      </form>
    </aside>
  );
}