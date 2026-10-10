import { useEffect, useState } from "react";
import { crearProducto, listarProductos } from "./services/productos.api";
import ProductoForm from "./components/ProductoForm";
import ProductoTable from "./components/ProductoTable";
import "./App.css";

export default function App() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function cargar() {
      setCargando(true);
      setError("");
      setMensaje("");

      try {
        const datos = await listarProductos(controller.signal);
        if (!controller.signal.aborted) setProductos(datos);
      } catch (fallo) {
        if (!controller.signal.aborted) setError(fallo.message);
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }

    cargar();

    // Cancela la petición si el componente se desmonta.
    return () => controller.abort();
  }, [intento]);

  async function guardar(producto) {
    setGuardando(true);
    setMensaje("");

    try {
      const creado = await crearProducto(producto);

      // Agrega la respuesta real del servidor a la lista.
      setProductos((actuales) => [...actuales, creado]);
      setMensaje(`Se agregó "${creado.nombre}" al catálogo.`);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="store">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Satoru Store, inicio">
          <span className="brand-mark">S</span>
          <span>Satoru <strong>Store</strong></span>
        </a>
        <span className="header-note">Tecnología y accesorios</span>
      </header>

      <main>
        <section className="intro">
          <p className="eyebrow">LA SELECCIÓN DE SATORU</p>
          <h1>Herramientas para tu día a día.</h1>
          <p className="intro-description">
            Explora el catálogo y encuentra tu próximo equipo.
          </p>
        </section>

        <div className="catalog-heading">
          <div>
            <h2>Catálogo</h2>
            <p>
              {cargando ? "Consultando productos..." : `${productos.length} productos registrados`}
            </p>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={() => setFormularioAbierto(true)}
            disabled={cargando || Boolean(error) || guardando}
          >
            + Agregar producto
          </button>
        </div>

        {mensaje && <p className="success-message" role="status">{mensaje}</p>}

        <div className={`catalog-layout ${formularioAbierto ? "with-form" : ""}`}>
          <section className="catalog-panel" aria-label="Lista de productos">
            <div className="catalog-toolbar">
              <span>Productos disponibles</span>
              <button
                type="button"
                className="text-button"
                disabled={cargando || guardando}
                onClick={() => setIntento((actual) => actual + 1)}
              >
                Actualizar
              </button>
            </div>

            {cargando ? (
              <div className="loading-state" role="status">
                <span className="spinner" aria-hidden="true" />
                Cargando catálogo...
              </div>
            ) : error ? (
              <div className="error-state" role="alert">
                <h3>No pudimos cargar los productos</h3>
                <p>{error}</p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setIntento((actual) => actual + 1)}
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <ProductoTable productos={productos} />
            )}
          </section>

          {formularioAbierto && (
            <ProductoForm
              onGuardar={guardar}
              onCerrar={() => setFormularioAbierto(false)}
              bloqueado={cargando || Boolean(error)}
            />
          )}
        </div>
      </main>

      <footer className="site-footer">
        <span>Satoru Store</span>
        <span>Una selección para estudiar, trabajar y crear.</span>
      </footer>
    </div>
  );
}