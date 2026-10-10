import { useState } from "react";

export default function ProductoForm({ onGuardar, onCerrar, bloqueado }) {
  const [campos, setCampos] = useState({
    nombre: "",
    precio: "",
    categoria: "",
  });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  function cambiar(event) {
    const { name, value } = event.target;
    setCampos((actual) => ({ ...actual, [name]: value }));
    setErrores((actual) => ({ ...actual, [name]: "" }));
    setError("");
  }

  async function enviar(event) {
    event.preventDefault();
    if (guardando || bloqueado) return;

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
      await onGuardar({ nombre, precio, categoria });
      setCampos({ nombre: "", precio: "", categoria: "" });
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

      <form onSubmit={enviar} noValidate>
        <fieldset disabled={guardando || bloqueado}>
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