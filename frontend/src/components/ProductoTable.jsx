// Da formato de quetzales para Guatemala; solo cambia la presentación del precio.
const moneda = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  minimumFractionDigits: 2,
});

// Recibe productos por props y los presenta; no consulta ni modifica la API.
export default function ProductoTable({ productos }) {
  if (!productos.length) {
    return <p className="empty-state">Todavía no hay productos en el catálogo.</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <caption className="sr-only">Productos de Satoru Store</caption>
        <thead>
          <tr>
            <th scope="col">Producto</th>
            <th scope="col">Categoría</th>
            <th scope="col" className="price-cell">Precio</th>
          </tr>
        </thead>
        <tbody>
          {/* El id estable ayuda a React a identificar cada fila al actualizar la lista. */}
          {productos.map((producto) => (
            <tr key={producto.id}>
              <td className="product-name">{producto.nombre}</td>
              <td>{producto.categoria}</td>
              <td className="price-cell">{moneda.format(producto.precio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}